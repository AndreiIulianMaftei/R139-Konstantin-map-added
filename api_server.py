# api_server.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chatbot import IsraelSafetyRAGBot
import uvicorn
import pandas as pd
from datetime import datetime
import pandas as pd

app = FastAPI(title="Israel Emergency Safety Bot API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize bot
print("🤖 Initializing Emergency Safety Bot...")
try:
    bot = IsraelSafetyRAGBot(model_name="gemma3:1b")
    
    # Clean database first to ensure fresh start
    if bot.clean_database(confirm=False):
        print("🧹 Database cleaned successfully")
    
    # Load CSV data using the same workflow as chatbot.py
    csv_files = ["bunker.csv", "embassies.csv", "bunkers.csv", "heat.csv"]
    if bot.load_csv_data(csv_files) and bot.setup_vectorstore() and bot.setup_qa_chain():
        print("✅ Bot initialized successfully!")
    else:
        print("❌ Bot initialization failed!")
        bot = None
except Exception as e:
    print(f"❌ Error initializing bot: {e}")
    bot = None

class Query(BaseModel):
    question: str

class LocationQuery(BaseModel):
    question: str
    user_lat: float = None
    user_lon: float = None

@app.get("/")
async def root():
    return {
        "message": "Israel Emergency Safety Bot API is running", 
        "status": "ready" if bot else "error",
        "data_sources": ["bunker.csv", "embassies.csv", "bunkers.csv", "heat.csv"] if bot else [],
        "total_records": len(bot.df) if bot and bot.df is not None else 0
    }

@app.post("/ask")
async def ask_question(query: Query):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        print(f"📝 Received question: {query.question}")
        
        # Use the same emergency response method as chatbot.py
        response = bot.get_emergency_response(query.question)
        
        print(f"✅ Generated response: {response[:100]}...")
        return {"response": response}
    except Exception as e:
        print(f"❌ Error processing question: {e}")
        # Return emergency fallback response like chatbot.py
        fallback_response = (f"❌ Emergency system error: {e}\n\n"
                           "🚨 IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)")
        return {"response": fallback_response}

@app.post("/nearest")
async def find_nearest_location(query: LocationQuery):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        print(f"📍 Finding nearest location for: {query.question}")
        
        if query.user_lat is None or query.user_lon is None:
            return {"response": "Please provide your coordinates (latitude and longitude) to find the nearest safety location."}
        
        # Find nearest safety location using chatbot method
        nearest = bot.find_nearest_safety_location(query.user_lat, query.user_lon)
        if nearest:
            response = f"""*Nearest Safety Location:*

*{nearest['type'].upper()}* in {nearest['name']}
Distance: {nearest['distance_km']} km
GPS: {nearest['lat']}, {nearest['lon']}

*Emergency Contacts:*
Police: 100 | Medical: 101 | Fire: 102"""
        else:
            response = "❌ No safety locations found in the database."
        
        return {"response": response}
    except Exception as e:
        print(f"❌ Error finding nearest location: {e}")
        fallback_response = (f"❌ Error finding location: {e}\n\n"
                           "🚨 IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)")
        return {"response": fallback_response}

@app.get("/emergency")
async def emergency_help():
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    # Return the same emergency help as chatbot.py
    help_response = bot._handle_emergency_command()
    return {"response": help_response}

@app.get("/stats")
async def get_stats():
    if not bot or bot.df is None:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        stats = {
            "total_records": len(bot.df),
            "data_types": bot.df['type'].value_counts().to_dict(),
            "sources": bot.df['source_file'].value_counts().to_dict() if 'source_file' in bot.df.columns else {},
            "cities": bot.df['city'].value_counts().to_dict()[:10]  # Top 10 cities
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@app.get("/mix-report")
async def get_mix_report():
    """Generate a comprehensive mixed report of all safety data"""
    if not bot or bot.df is None:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        # Generate comprehensive statistics
        total_records = len(bot.df)
        data_types = bot.df['type'].value_counts().to_dict()
        sources = bot.df['source_file'].value_counts().to_dict() if 'source_file' in bot.df.columns else {}
        cities = bot.df['city'].value_counts().to_dict()
        
        # Calculate geographic distribution
        lat_range = f"{bot.df['lat'].min():.4f} to {bot.df['lat'].max():.4f}"
        lon_range = f"{bot.df['lon'].min():.4f} to {bot.df['lon'].max():.4f}"
          # Generate the mixed report
        report = f"""*COMPREHENSIVE SAFETY DATA REPORT*
Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

*OVERVIEW STATISTICS:*
- Total Safety Locations: {total_records}
- Data Sources: {len(sources)}
- Cities Covered: {len(cities)}
- Geographic Coverage: Lat {lat_range}, Lon {lon_range}

*SAFETY FACILITY BREAKDOWN:*"""
        
        # Add type breakdown
        for facility_type, count in data_types.items():
            percentage = (count / total_records) * 100
            report += f"\n- {facility_type.upper()}: {count} locations ({percentage:.1f}%)"
        report += f"\n\n*DATA SOURCE ANALYSIS:*"
        for source, count in sources.items():
            percentage = (count / total_records) * 100
            report += f"\n- {source}: {count} records ({percentage:.1f}%)"
        
        # Top 10 cities
        report += f"\n\n*TOP 10 CITIES BY SAFETY LOCATIONS:*"
        top_cities = list(cities.items())[:10]
        for i, (city, count) in enumerate(top_cities, 1):
            report += f"\n{i}. {city}: {count} locations"
        
        # Coverage analysis
        bunkers = data_types.get('bunker', 0) + data_types.get('shelter', 0)
        embassies = data_types.get('embassy', 0)
        heat_zones = data_types.get('heat', 0)
        
        report += f"\n\n*SAFETY COVERAGE ANALYSIS:*"
        report += f"\n- Protective Facilities: {bunkers} ({((bunkers/total_records)*100):.1f}%)"
        report += f"\n- Diplomatic Support: {embassies} ({((embassies/total_records)*100):.1f}%)"
        report += f"\n- Heat Risk Zones: {heat_zones} ({((heat_zones/total_records)*100):.1f}%)"
        
        # Emergency recommendations
        report += f"\n\n*EMERGENCY PREPAREDNESS:*"
        report += f"\n- Know your nearest bunker/shelter location"
        report += f"\n- Keep emergency contacts ready: Police 100, Medical 101, Fire 102"
        report += f"\n- Stay informed via Home Front Command alerts"
        report += f"\n- Maintain emergency supplies (water, food, first aid)"
        
        # Data quality indicators
        missing_cities = bot.df['city'].isna().sum()
        if missing_cities > 0:
            report += f"\n\n*DATA QUALITY NOTES:*"
            report += f"\n- {missing_cities} records missing city information"
        
        return {"response": report}
        
    except Exception as e:
        print(f"❌ Error generating mix report: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Israel Emergency Safety Bot API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
