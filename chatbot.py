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
        """Create content based on location type with intensity consideration"""
        city_name = row.get('city', row.get('name', 'Unknown Location'))
        source_file = row.get('source_file', 'data')
        
        # Handle intensity for dangerous locations
        intensity = row.get('ins', None)
        intensity_text = ""
        danger_level = "UNKNOWN"
        
        if intensity is not None:
            intensity = float(intensity)
            if intensity >= 0.8:
                danger_level = "EXTREME"
                intensity_text = f"CRITICAL THREAT LEVEL: {intensity:.1f}/1.0 - EVACUATE IMMEDIATELY"
            elif intensity >= 0.6:
                danger_level = "HIGH" 
                intensity_text = f"High Threat Level: {intensity:.1f}/1.0 - AVOID AREA"
            elif intensity >= 0.4:
                danger_level = "MODERATE"
                intensity_text = f"Moderate Threat Level: {intensity:.1f}/1.0 - Exercise Caution"
            else:
                danger_level = "LOW"
                intensity_text = f"Low Threat Level: {intensity:.1f}/1.0 - Monitor Situation"
        
        # Enhanced content templates with intensity consideration
        content_templates = {
            'bunker': f"""
            PROTECTIVE BUNKER - {city_name} ({row['lat']}, {row['lon']})
            Maximum protection from rockets, explosions, and missile strikes. 
            Reinforced concrete structure. Go here immediately during alerts.
            Description: {row.get('desc', 'Emergency protective facility')}
            Source: {source_file}
            """,
            'shelter': f"""
            EMERGENCY SHELTER - {city_name} ({row['lat']}, {row['lon']})
            Good protection during air raids and emergencies. Stay until all-clear signal.
            Capacity for multiple people. Safe refuge during attacks.
            Description: {row.get('desc', 'Emergency shelter facility')}
            Source: {source_file}
            """,
            'embassy': f"""
            DIPLOMATIC EMBASSY - {city_name} ({row['lat']}, {row['lon']})
            Safe diplomatic facility with international protection.
            Contact for citizen services, emergency assistance, and evacuation support.
            Description: {row.get('desc', 'Diplomatic facility')}
            Source: {source_file}
            """,
            'explosion': f"""
            EXPLOSION INCIDENT - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            DANGER: Active explosion zone. AVOID this area completely.
            Call 100 (Police), 101 (Medical), 102 (Fire) immediately.
            Source: {source_file}
            """,
            'drone strike': f"""
            DRONE STRIKE - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            DANGER: Aerial attack in progress. Seek immediate shelter.
            Call 100 (Police) and find nearest bunker/shelter.
            Source: {source_file}
            """,
            'car explosion': f"""
            CAR EXPLOSION - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            DANGER: Vehicle explosion. EVACUATE 200m radius minimum.
            Call 100 (Police), 101 (Medical), 102 (Fire).
            Source: {source_file}
            """,
            'missile strike': f"""
            MISSILE STRIKE - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            CRITICAL DANGER: Missile impact zone. EVACUATE IMMEDIATELY.
            Call 100 (Police) and seek underground shelter.
            Source: {source_file}
            """,
            'forces gathering': f"""
            FORCES GATHERING - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            SECURITY ALERT: Military/hostile forces detected.
            AVOID area and report to 100 (Police).
            Source: {source_file}
            """,
            'air strikes': f"""
            AIR STRIKES - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            CRITICAL DANGER: Aerial bombardment in progress.
            Seek immediate underground shelter. Call 100 (Police).
            Source: {source_file}
            """,
            'soldiers spotted': f"""
            SOLDIERS SPOTTED - {city_name} ({row['lat']}, {row['lon']})
            {intensity_text}
            SECURITY ALERT: Armed personnel in area.
            Exercise extreme caution. Monitor situation.
            Source: {source_file}
            """
        }
        
        return content_templates.get(row['type'], f"""        LOCATION - {city_name} ({row['lat']}, {row['lon']})
        Type: {row['type']} - {intensity_text if intensity_text else 'Location information available'}
        Source: {source_file}
        """)
    
    def create_documents_from_csv(self) -> List[Document]:
        """Convert CSV data into LangChain documents with enhanced city and context information"""
        documents = []
        
        for _, row in self.df.iterrows():
            content = self._create_content_by_type(row)
            city_name = row.get('city', row.get('name', 'Unknown'))
            
            # Create comprehensive metadata for better retrieval
            metadata = {
                "type": row['type'],
                "city": city_name,
                "city_lower": city_name.lower(),
                "lat": float(row['lat']),
                "lon": float(row['lon']),
                "source": row.get('source_file', 'israel_safety_database'),
                "source_file": row.get('source_file', 'data.csv'),
                "category": "safety" if row['type'] in ['bunker', 'shelter', 'embassy'] else "danger"
            }
            
            # Add intensity data for threat locations
            if 'ins' in row and pd.notna(row['ins']):
                intensity = float(row['ins'])
                metadata["intensity"] = intensity
                metadata["threat_level"] = (
                    "CRITICAL" if intensity >= 0.8 else
                    "HIGH" if intensity >= 0.6 else
                    "MODERATE" if intensity >= 0.4 else
                    "LOW"
                )
            
            # Create multiple document variations for better matching
            base_doc = Document(page_content=content, metadata=metadata)
            documents.append(base_doc)
            
            # Create city-specific document for better city queries
            city_content = f"""
            CITY: {city_name}
            FACILITY TYPE: {row['type'].upper()}
            COORDINATES: {row['lat']}, {row['lon']}
            {content}
            """
            
            city_doc = Document(
                page_content=city_content,
                metadata={**metadata, "document_type": "city_specific"}
            )
            documents.append(city_doc)
            
            # Create protection-specific documents for safety facilities
            if row['type'] in ['bunker', 'shelter', 'embassy']:
                protection_content = f"""
                PROTECTION AVAILABLE IN {city_name}:
                TYPE: {row['type'].upper()} - Safe facility for emergency protection
                LOCATION: {city_name} at coordinates {row['lat']}, {row['lon']}
                USE FOR: Emergency shelter, rocket alerts, air raids, dangerous situations
                {content}
                """
                
                protection_doc = Document(
                    page_content=protection_content,
                    metadata={**metadata, "document_type": "protection_focused"}
                )
                documents.append(protection_doc)
        
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
                    rprint(Panel("🔄 Cleaning database and recreating with new embedding dimensions...", style="yellow"))                    # Clean database and try again
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
        """Setup the RAG QA chain with enhanced contextual prompting"""
        try:
            llm = ChatOllama(model=self.model_name, temperature=0.1)
            custom_prompt = PromptTemplate(
                template="""You are an AI emergency assistant for Israel safety. Analyze the user's question carefully and provide precise, actionable responses.

QUERY ANALYSIS INSTRUCTIONS:
1. CITY IDENTIFICATION: If user mentions a specific city name, prioritize information for that exact city
2. PROTECTION REQUESTS: If user asks about safety, shelter, bunkers, or protection, focus on safety facilities
3. ALWAYS INCLUDE: Both safety facilities AND nearby threats to avoid in every response

RESPONSE STRUCTURE - ALWAYS FOLLOW THIS FORMAT:

*SAFETY FACILITIES IN [CITY]:*
[List specific bunkers, shelters, embassies in the requested city with GPS coordinates]

*THREAT ZONES TO AVOID NEARBY:*
[List dangerous areas with intensity levels - ALWAYS include this section]

*EMERGENCY GUIDANCE:*
[Specific action steps based on the query]

CRITICAL RULES:
- If user mentions a city, be PRECISE - only show facilities in that exact city
- ALWAYS show both safety facilities AND threat zones in every response  
- Use intensity ratings: CRITICAL (0.8+), HIGH (0.6-0.8), MODERATE (0.4-0.6), LOW (<0.4)
- Include GPS coordinates for all locations
- Use simple markdown: *text* for emphasis only
- Prioritize the most relevant information first
-keep markdown simple and clear

FORMATTING:
- Use *text* for emphasis (single asterisks only)
- Use - for bullet points  
- Include GPS coordinates as (lat, lon)
- Keep responses clear and actionable

Context: {context}
Question: {question}

Precise emergency response:""",
                input_variables=["context", "question"]
            )
            
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=self.vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 8}  # Increased to get more context
                ),
                chain_type_kwargs={"prompt": custom_prompt},
                return_source_documents=True
            )
            
            rprint(Panel("✅ Enhanced Emergency QA system ready!", style="green"))
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
        """Get emergency response using enhanced RAG with city precision and threat awareness"""
        try:
            with console.status("[bold red]🚨 Processing emergency query...", spinner="dots"):
                result = self.qa_chain({"query": question})
            
            response = result['result']
            
            # Extract city from question for enhanced responses
            question_lower = question.lower()
            mentioned_cities = []
            if self.df is not None:
                for city in self.df['city'].dropna().unique():
                    if city.lower() in question_lower:
                        mentioned_cities.append(city)
            
            # Enhance response with specific location data
            if result.get('source_documents'):
                safety_docs = []
                threat_docs = []
                
                for doc in result['source_documents']:
                    metadata = doc.metadata
                    if metadata.get('category') == 'safety':
                        safety_docs.append(metadata)
                    elif metadata.get('category') == 'danger':
                        threat_docs.append(metadata)
                
                # Always add structured location information
                response += "\n\n*LOCATION INTELLIGENCE:*\n"
                
                # Safety facilities section
                if safety_docs:
                    response += "\n*Available Protection:*\n"
                    for i, doc in enumerate(safety_docs[:3], 1):
                        response += f"{i}. *{doc['type'].upper()}* - {doc['city']}\n"
                        response += f"   GPS: {doc['lat']}, {doc['lon']}\n"
                
                # Threat zones section - ALWAYS include if available
                if threat_docs:
                    response += "\n*Threat Zones to Avoid:*\n"
                    for i, doc in enumerate(threat_docs[:3], 1):
                        threat_level = doc.get('threat_level', 'UNKNOWN')
                        intensity = doc.get('intensity', 0)
                        response += f"{i}. *{threat_level}* - {doc['type']} in {doc['city']}\n"
                        response += f"   Intensity: {intensity:.1f}/1.0 | GPS: {doc['lat']}, {doc['lon']}\n"
                
                # Add city-specific guidance if city was mentioned
                if mentioned_cities:
                    city_name = mentioned_cities[0]  # Use first mentioned city
                    city_safety = [doc for doc in safety_docs if doc['city'].lower() == city_name.lower()]
                    city_threats = [doc for doc in threat_docs if doc['city'].lower() == city_name.lower()]
                    
                    response += f"\n*Specific to {city_name}:*\n"
                    if city_safety:
                        response += f"- {len(city_safety)} safety facilities available\n"
                    if city_threats:
                        avg_intensity = sum(doc.get('intensity', 0) for doc in city_threats) / len(city_threats)
                        response += f"- {len(city_threats)} threat zones (avg intensity: {avg_intensity:.1f})\n"
            
            return response
            
        except Exception as e:
            return (f"❌ Emergency system error: {e}\n\n"
                   "🚨 IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)")
    
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
    
    def find_contextual_locations(self, user_lat: float, user_lon: float, 
                                 query_type: str = "safety") -> List[Dict]:
        """Find locations based on query context (safety vs danger)"""
        results = []
        
        if query_type.lower() in ["safety", "shelter", "bunker", "embassy", "protection", "bank"]:
            # Find safety locations (bunkers, shelters, embassies)
            safety_types = ['bunker', 'shelter', 'embassy']
            filtered_df = self.df[self.df['type'].isin(safety_types)]
            for _, row in filtered_df.iterrows():
                distance = self.calculate_distance(user_lat, user_lon, row['lat'], row['lon'])
                results.append({
                    'type': row['type'],
                    'name': row.get('name', row.get('city', 'Unknown')),
                    'lat': row['lat'],
                    'lon': row['lon'],
                    'distance_km': round(distance, 2),
                    'category': 'safety',
                    'description': row.get('desc', 'Safety facility')
                })
        
        elif query_type.lower() in ["danger", "threat", "risk", "avoid", "hazard"]:
            # Find dangerous locations with intensity ratings
            danger_types = ['explosion', 'drone strike', 'car explosion', 'missile strike', 
                          'forces gathering', 'air strikes', 'soldiers spotted']
            filtered_df = self.df[self.df['type'].isin(danger_types)]
            for _, row in filtered_df.iterrows():
                distance = self.calculate_distance(user_lat, user_lon, row['lat'], row['lon'])
                intensity = row.get('ins', 0)
                
                # Classify danger level
                if intensity >= 0.8:
                    danger_level = "CRITICAL"
                elif intensity >= 0.6:
                    danger_level = "HIGH"
                elif intensity >= 0.4:
                    danger_level = "MODERATE"
                else:
                    danger_level = "LOW"
                
                results.append({
                    'type': row['type'],
                    'name': row.get('name', row.get('city', 'Unknown')),
                    'lat': row['lat'],
                    'lon': row['lon'],
                    'distance_km': round(distance, 2),
                    'category': 'danger',
                    'intensity': intensity,
                    'danger_level': danger_level
                })
        
        else:            # General query - return mixed results
            for _, row in self.df.iterrows():
                distance = self.calculate_distance(user_lat, user_lon, row['lat'], row['lon'])
                category = 'safety' if row['type'] in ['bunker', 'shelter', 'embassy'] else 'danger'
                
                result = {
                    'type': row['type'],
                    'name': row.get('name', row.get('city', 'Unknown')),
                    'lat': row['lat'],
                    'lon': row['lon'],
                    'distance_km': round(distance, 2),
                    'category': category
                }
                
                if category == 'danger':
                    intensity = row.get('ins', 0)
                    result['intensity'] = intensity
                    if intensity >= 0.8:
                        result['danger_level'] = "CRITICAL"
                    elif intensity >= 0.6:
                        result['danger_level'] = "HIGH"
                    elif intensity >= 0.4:
                        result['danger_level'] = "MODERATE"
                    else:
                        result['danger_level'] = "LOW"
                else:
                    result['description'] = row.get('desc', 'Safety facility')
                
                results.append(result)
        
        # Sort by distance
        results.sort(key=lambda x: x['distance_km'])
        return results[:10]  # Return top 10 closest
    
    def extract_city_from_query(self, question: str) -> List[str]:
        """Extract city names mentioned in the user query"""
        question_lower = question.lower()
        mentioned_cities = []
        
        if self.df is not None:
            # Check for exact city matches
            for city in self.df['city'].dropna().unique():
                city_lower = city.lower()
                if city_lower in question_lower:
                    # Ensure it's a word boundary match, not part of another word
                    import re
                    if re.search(r'\b' + re.escape(city_lower) + r'\b', question_lower):
                        mentioned_cities.append(city)
        
        return mentioned_cities
    
    def get_city_specific_data(self, city_name: str) -> Dict:
        """Get all safety and threat data for a specific city"""
        if self.df is None:
            return {"safety": [], "threats": []}
        
        city_df = self.df[self.df['city'].str.lower() == city_name.lower()]
        
        safety_types = ['bunker', 'shelter', 'embassy']
        danger_types = ['explosion', 'drone strike', 'car explosion', 'missile strike', 
                       'forces gathering', 'air strikes', 'soldiers spotted']
        
        safety_facilities = []
        threat_zones = []
        
        for _, row in city_df.iterrows():
            location_data = {
                'type': row['type'],
                'name': row.get('name', row.get('city', 'Unknown')),
                'lat': row['lat'],
                'lon': row['lon'],
                'description': row.get('desc', '')
            }
            
            if row['type'] in safety_types:
                safety_facilities.append(location_data)
            elif row['type'] in danger_types:
                location_data['intensity'] = row.get('ins', 0)
                if location_data['intensity'] >= 0.8:
                    location_data['threat_level'] = 'CRITICAL'
                elif location_data['intensity'] >= 0.6:
                    location_data['threat_level'] = 'HIGH'
                elif location_data['intensity'] >= 0.4:
                    location_data['threat_level'] = 'MODERATE'
                else:
                    location_data['threat_level'] = 'LOW'
                threat_zones.append(location_data)
        
        return {
            "safety": safety_facilities,
            "threats": threat_zones,
            "city": city_name
        }
    
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
