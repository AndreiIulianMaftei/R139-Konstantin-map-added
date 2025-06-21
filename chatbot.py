import pandas as pd
import chromadb
from chromadb.config import Settings
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate
from langchain_community.embeddings import HuggingFaceEmbeddings
from rich import print as rprint
from rich.panel import Panel
from rich.console import Console
from rich.prompt import Prompt
from rich.text import Text
import os
import math
import shutil
from typing import List, Dict, Optional

console = Console()

class IsraelSafetyRAGBot:
    def __init__(self, model_name: str = "llama2"):
        self.model_name = model_name
        self.embeddings = None
        self.vectorstore = None
        self.qa_chain = None
        self.df = None
        self.db_path = "./chroma_db"
        
    def load_csv_data(self, csv_files: List[str] = None) -> bool:
        """Load and process multiple CSV data files"""
        if csv_files is None:
            csv_files = ["bunker.csv", "embassies.csv", "bunkers.csv", "heat.csv"]
        
        try:
            combined_dfs = []
            total_records = 0
            file_stats = {}
            
            for csv_file in csv_files:
                try:
                    # Load individual CSV file
                    df = pd.read_csv(csv_file)
                    df.columns = df.columns.str.strip()
                    
                    # Ensure required columns exist
                    required_columns = ['lat', 'lon', 'type']
                    for col in required_columns:
                        if col not in df.columns:
                            rprint(Panel(f"⚠️ Warning: '{col}' column missing in {csv_file}", style="yellow"))
                            continue
                    
                    # Add source file information
                    df['source_file'] = csv_file
                    
                    # Use 'city' if exists, otherwise use 'name'
                    if 'city' not in df.columns and 'name' in df.columns:
                        df['city'] = df['name']
                    elif 'city' not in df.columns:
                        df['city'] = f"Location from {csv_file}"
                    
                    combined_dfs.append(df)
                    file_stats[csv_file] = {
                        'records': len(df),
                        'types': df['type'].value_counts().to_dict() if 'type' in df.columns else {}
                    }
                    total_records += len(df)
                    
                    rprint(Panel(f"✅ Loaded {csv_file}: {len(df)} records", style="green"))
                    
                except FileNotFoundError:
                    rprint(Panel(f"⚠️ File not found: {csv_file} - skipping", style="yellow"))
                    continue
                except Exception as file_error:
                    rprint(Panel(f"❌ Error loading {csv_file}: {file_error}", style="red"))
                    continue
            
            if not combined_dfs:
                rprint(Panel("❌ No CSV files could be loaded successfully", style="red"))
                return False
            
            # Combine all DataFrames
            self.df = pd.concat(combined_dfs, ignore_index=True)
            self.df.columns = self.df.columns.str.strip()
            
            # Display summary
            rprint(Panel(f"✅ Combined CSV data loaded: {total_records} total records", style="green"))
            
            # Show breakdown by file
            for file_name, stats in file_stats.items():
                if stats['types']:
                    type_info = ", ".join([f"{k}: {v}" for k, v in stats['types'].items()])
                    rprint(Panel(f"📊 {file_name}: {stats['records']} records ({type_info})", style="blue"))
            
            # Show overall type distribution
            if 'type' in self.df.columns:
                overall_types = self.df['type'].value_counts().to_dict()
                rprint(Panel(f"📈 Overall data types: {overall_types}", style="cyan"))
            
            return True
            
        except Exception as e:
            rprint(Panel(f"❌ Error loading CSV data: {e}", style="red"))
            return False
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers using Haversine formula"""
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _create_content_by_type(self, row: pd.Series) -> str:
        """Create content based on location type"""
        city_name = row.get('city', row.get('name', 'Unknown Location'))
        source_file = row.get('source_file', 'data')
        
        content_templates = {
            'bunker': f"""
            BUNKER - {city_name} ({row['lat']}, {row['lon']})
            Maximum protection from rockets/explosions. Go here during alerts.
            Source: {source_file}
            """,
            'shelter': f"""
            SHELTER - {city_name} ({row['lat']}, {row['lon']})
            Good protection during air raids. Stay until all-clear.
            Source: {source_file}
            """,
            'embassy': f"""
            EMBASSY - {city_name} ({row['lat']}, {row['lon']})
            Safe diplomatic facility. Contact for citizen services and emergency assistance.
            Source: {source_file}
            """,
            'heat': f"""
            HEAT ZONE - {city_name} ({row['lat']}, {row['lon']})
            High temperature area. Risk of heat-related health issues. Stay hydrated, seek shade.
            Source: {source_file}
            """,
            'shooting': f"""
            SHOOTING ALERT - {city_name} ({row['lat']}, {row['lon']})
            AVOID AREA. Call 100 (Police). Very dangerous situation
            Source: {source_file}
            """,
            'bomb': f"""
            BOMB ALERT - {city_name} ({row['lat']}, {row['lon']})
            EVACUATE 500m+. Call 100 (Police). Extremely dangerous situation
            Source: {source_file}
            """
        }
        
        return content_templates.get(row['type'], f"""
        LOCATION - {city_name} ({row['lat']}, {row['lon']})
        Type: {row['type']} - Location information available
        Source: {source_file}
        """)
    
    def create_documents_from_csv(self) -> List[Document]:
        """Convert CSV data into LangChain documents"""
        documents = []
        
        for _, row in self.df.iterrows():
            content = self._create_content_by_type(row)
            
            doc = Document(
                page_content=content,
                metadata={
                    "type": row['type'],
                    "city": row.get('city', row.get('name', 'Unknown')),
                    "lat": float(row['lat']),
                    "lon": float(row['lon']),
                    "source": row.get('source_file', 'israel_safety_database'),
                    "source_file": row.get('source_file', 'data.csv')
                }
            )
            documents.append(doc)
        
        return documents
    
    def setup_vectorstore(self) -> bool:
        """Initialize ChromaDB vectorstore with embeddings"""
        try:
            rprint(Panel("🔧 Setting up embeddings...", style="yellow"))
            
            try:
                self.embeddings = OllamaEmbeddings(model="mxbai-embed-large")
                rprint(Panel("✅ Using mxbai-embed-large for embeddings", style="green"))
            except Exception:
                rprint(Panel("🔄 Falling back to HuggingFace embeddings...", style="yellow"))
                self.embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2"
                )
            
            documents = self.create_documents_from_csv()
            
            try:
                # Try to create/connect to vectorstore
                self.vectorstore = Chroma.from_documents(
                    documents=documents,
                    embedding=self.embeddings,
                    persist_directory=self.db_path,
                    collection_name="israel_safety_data"
                )
                rprint(Panel("✅ Vector database created successfully!", style="green"))
                return True
                
            except Exception as vectorstore_error:
                # Check if it's a dimension mismatch error
                if "dimension" in str(vectorstore_error).lower():
                    rprint(Panel(f"⚠️ Dimension mismatch detected: {vectorstore_error}", style="yellow"))
                    rprint(Panel("🔄 Cleaning database and recreating with new embedding dimensions...", style="yellow"))
                    
                    # Clean database and try again
                    if self.clean_database(confirm=False):  # Auto-confirm cleanup
                        self.vectorstore = Chroma.from_documents(
                            documents=documents,
                            embedding=self.embeddings,
                            persist_directory=self.db_path,
                            collection_name="israel_safety_data"
                        )
                        rprint(Panel("✅ Vector database recreated successfully with new dimensions!", style="green"))
                        return True
                    else:
                        raise Exception("Failed to clean database for dimension mismatch")
                else:
                    raise vectorstore_error
            
        except Exception as e:
            rprint(Panel(f"❌ Error setting up vectorstore: {e}", style="red"))
            return False
    
    def setup_qa_chain(self) -> bool:
        """Setup the RAG QA chain"""
        try:
            llm = ChatOllama(model=self.model_name, temperature=0.1)
            custom_prompt = PromptTemplate(
                template="""You are an AI emergency assistant for Israel safety. Provide IMMEDIATE, CLEAR, and ACTIONABLE responses.

INSTRUCTIONS:
- Prioritize SAFETY above all else
- Use SIMPLE markdown formatting ONLY: bold text with single asterisks *like this*
- DO NOT use double asterisks, complex formatting, or special characters
- Start important sections with simple bullet points using -
- Include emergency contact numbers when relevant
- Be calm but supportive
- Include relevant location information
- Keep responses clear and readable

FORMATTING RULES:
- Use *text* for emphasis (single asterisks only)
- Use simple bullet points with -
- Use plain text for most content
- NO fancy symbols, emojis, or complex markdown

Context: {context}
Question: {question}

Emergency response:""",
                input_variables=["context", "question"]
            )
            
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=self.vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 5}
                ),
                chain_type_kwargs={"prompt": custom_prompt},
                return_source_documents=True
            )
            
            rprint(Panel("✅ Emergency QA system ready!", style="green"))
            return True
            
        except Exception as e:
            rprint(Panel(f"❌ Error setting up QA chain: {e}", style="red"))
            return False
    
    def find_nearest_safety_location(self, user_lat: float, user_lon: float, 
                                   safety_type: Optional[str] = None) -> Optional[Dict]:
        """Find nearest bunker or shelter"""
        if safety_type:
            filtered_df = self.df[self.df['type'] == safety_type]
        else:
            filtered_df = self.df[self.df['type'].isin(['bunker', 'shelter'])]
        
        if filtered_df.empty:
            return None
            
        min_distance = float('inf')
        nearest_location = None
        
        for _, row in filtered_df.iterrows():
            distance = self.calculate_distance(user_lat, user_lon, row['lat'], row['lon'])
            if distance < min_distance:
                min_distance = distance
                nearest_location = {
                    'type': row['type'],
                    'name': row['name'],
                    'lat': row['lat'],
                    'lon': row['lon'],
                    'distance_km': round(distance, 2)
                }
        
        return nearest_location
    def get_emergency_response(self, question: str) -> str:
        """Get emergency response using RAG"""
        try:
            with console.status("[bold red]🚨 Processing emergency query...", spinner="dots"):
                result = self.qa_chain({"query": question})
            
            response = result['result']
            
            # Add source information with simple formatting
            if result.get('source_documents'):
                response += "\n\n*Relevant Locations:*\n"
                for i, doc in enumerate(result['source_documents'][:3], 1):
                    metadata = doc.metadata
                    response += f"- {metadata['type'].upper()} in {metadata['city']} "
                    response += f"(GPS: {metadata['lat']}, {metadata['lon']})\n"
            
            return response
            
        except Exception as e:
            return (f"Emergency system error: {e}\n\n"
                   "IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)")
    
    def show_emergency_help(self):
        """Show emergency commands and help"""
        help_text = """
🚨 **ISRAEL EMERGENCY SAFETY BOT** 🚨

**EMERGENCY CONTACTS:**
🚔 Police: 100 | 🚑 Medical: 101 | 🚒 Fire: 102 | 🏠 Home Front: 104

**COMMANDS:**
/nearest - Find nearest bunker/shelter
/location [city] - Get safety info for city
/danger [location] - Check danger zones
/emergency - Get immediate instructions
/help - Show this help | /exit - Exit bot

**EXAMPLES:**
- "Where is the nearest bunker to me in Tel Aviv?"
- "Is it safe to go to Jerusalem right now?"
- "I hear sirens, what should I do?"

⚠️ **In immediate danger, call 100 first!**
        """
        rprint(Panel(help_text, title="🚨 Emergency Help", style="red"))
    def _handle_emergency_command(self) -> str:
        """Handle /emergency command"""
        return """*IMMEDIATE EMERGENCY ACTIONS:*

*ROCKET ALERT:*
- Find nearest bunker/reinforced room
- 90 seconds in most areas
- Stay away from windows, lie on floor

*SHOOTING:*
- Get down immediately, find cover
- Call 100 (Police), stay hidden

*GENERAL:*
- Keep emergency contacts ready
- Know nearest shelter location
- Follow Home Front Command instructions"""
    
    def clean_database(self, confirm: bool = True) -> bool:
        """Clean the ChromaDB database by removing all existing data"""
        try:
            if confirm:
                rprint(Panel("⚠️ WARNING: This will permanently delete all data in ChromaDB!", style="red"))
                response = Prompt.ask("🤔 Are you sure you want to proceed?", choices=["yes", "no"], default="no")
                
                if response.lower() != "yes":
                    rprint(Panel("❌ Database cleanup cancelled", style="yellow"))
                    return False
            
            rprint(Panel("🧹 Cleaning ChromaDB database...", style="yellow"))
            
            # Method 1: Try to delete collections first
            try:
                client = chromadb.PersistentClient(path=self.db_path)
                collections = client.list_collections()
                
                for collection in collections:
                    rprint(f"🗑️ Deleting collection: {collection.name}")
                    client.delete_collection(collection.name)
                    
                rprint(Panel("✅ All collections deleted successfully", style="green"))
                
            except Exception as collection_error:
                rprint(Panel(f"⚠️ Collection deletion failed: {collection_error}", style="yellow"))
                rprint(Panel("🔄 Trying directory removal method...", style="yellow"))
                
                # Method 2: Remove the entire directory
                if os.path.exists(self.db_path):
                    shutil.rmtree(self.db_path)
                    rprint(Panel(f"🗑️ Removed directory: {self.db_path}", style="green"))
                    
                # Recreate the directory
                os.makedirs(self.db_path, exist_ok=True)
                rprint(Panel(f"📁 Recreated directory: {self.db_path}", style="green"))
            
            # Reset vectorstore
            self.vectorstore = None
            
            rprint(Panel("✅ ChromaDB cleaned successfully! Database is now empty.", style="green"))
            return True
            
        except Exception as e:
            rprint(Panel(f"❌ Error cleaning ChromaDB: {e}", style="red"))
            return False
    
    def run(self):
        """Main chatbot loop"""
        console.clear()
        
        title = Text("🚨 ISRAEL EMERGENCY SAFETY BOT 🚨", style="bold red")
        rprint(Panel(title, style="bold red"))
        
        # Initialize system
        if not (self.load_csv_data() and self.setup_vectorstore() and self.setup_qa_chain()):
            return
        
        self.show_emergency_help()
        rprint(Panel("🟢 EMERGENCY SYSTEM READY", style="green"))
        
        while True:
            try:
                user_input = Prompt.ask("\n[bold red]🚨 Emergency Query[/bold red]")
                
                if not user_input.strip():
                    continue
                
                # Handle commands
                if user_input.lower() in ["/exit", "/quit"]:
                    rprint(Panel("Stay safe! Emergency: Police 100, Medical 101", style="yellow"))
                    break
                elif user_input.lower() == "/help":
                    self.show_emergency_help()
                    continue
                elif user_input.lower() == "/emergency":
                    rprint(Panel(self._handle_emergency_command(), 
                               title="🚨 EMERGENCY GUIDE", style="red"))
                    continue
                
                # Get AI response
                response = self.get_emergency_response(user_input)
                rprint(Panel(response, title="🚨 Emergency Response", style="red"))
                
            except KeyboardInterrupt:
                rprint(Panel("Stay safe! Emergency: Police 100, Medical 101", style="yellow"))
                break
            except Exception as e:
                rprint(Panel(f"❌ System error: {e}\n🚨 Call emergency services!", style="red"))

def main():
    try:
        bot = IsraelSafetyRAGBot(model_name="gemma3:1b")
        bot.clean_database()
        
        bot.run()
    except Exception as e:
        console.print(f"[red]❌ Failed to start emergency bot: {e}[/red]")
        console.print("[yellow]🚨 Emergency: Police 100, Medical 101[/yellow]")

if __name__ == "__main__":
    main()
