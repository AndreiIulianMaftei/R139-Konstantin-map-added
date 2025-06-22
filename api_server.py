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
    csv_files = ["public/embassies.csv", "public/bunkers.csv", "public/heat.csv"]
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
    query_type: str = "general"  # safety, danger, or general

class ContextualQuery(BaseModel):
    question: str
    context_type: str = "general"  # safety, danger, general, threat_assessment

@app.get("/")
async def root():
    if not bot or bot.df is None:
        return {
            "message": "Israel Emergency Safety Bot API", 
            "status": "error - bot not initialized",
            "endpoints": ["/ask", "/city-info", "/nearest", "/threat-assessment", "/emergency", "/stats", "/mix-report"]
        }
    
    # Calculate quick statistics
    safety_types = ['bunker', 'shelter', 'embassy']
    danger_types = ['explosion', 'drone strike', 'car explosion', 'missile strike', 
                   'forces gathering', 'air strikes', 'soldiers spotted']
    
    safety_count = len(bot.df[bot.df['type'].isin(safety_types)])
    danger_count = len(bot.df[bot.df['type'].isin(danger_types)])
    
    # Get threat intensity summary
    danger_df = bot.df[bot.df['type'].isin(danger_types)]
    threat_summary = "No threat data"
    if not danger_df.empty and 'ins' in danger_df.columns:
        critical_count = len(danger_df[danger_df['ins'] >= 0.8])
        high_count = len(danger_df[danger_df['ins'] >= 0.6])
        threat_summary = f"{critical_count} critical, {high_count} high threats"
    
    return {
        "message": "Israel Emergency Safety Bot API - Enhanced with Threat Intelligence", 
        "status": "ready",
        "capabilities": {
            "contextual_responses": "Analyzes query type (safety vs danger) for appropriate responses",
            "threat_assessment": "Provides comprehensive threat analysis with intensity ratings", 
            "location_intelligence": "Finds locations based on safety or danger context",
            "intensity_ratings": "Processes threat levels from 0.0 (low) to 1.0 (critical)"
        },
        "data_summary": {
            "total_records": len(bot.df),
            "safety_facilities": safety_count,
            "threat_zones": danger_count,
            "threat_overview": threat_summary,
            "data_sources": ["public/embassies.csv", "public/bunkers.csv", "public/heat.csv"]
        },        "endpoints": {
            "/ask": "Enhanced contextual emergency responses with city detection",
            "/city-info": "Comprehensive city-specific safety and threat information", 
            "/nearest": "Find locations by safety/danger context",
            "/threat-assessment": "Comprehensive threat analysis",
            "/emergency": "Emergency protocols",
            "/stats": "Detailed statistics with threat analysis",
            "/mix-report": "Comprehensive data report with intensity metrics"
        }
    }

@app.post("/ask")
async def ask_question(query: ContextualQuery):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        print(f"📝 Received question: {query.question} (context: {query.context_type})")
        
        # Enhanced query analysis
        question_lower = query.question.lower()
        
        # Detect protection/safety requests
        protection_keywords = ['safety', 'safe', 'bunker', 'shelter', 'protection', 'protect', 'hide', 'refuge']
        is_protection_request = any(keyword in question_lower for keyword in protection_keywords)
        
        # Detect city mentions
        mentioned_cities = bot.extract_city_from_query(query.question)
        
        # Get the enhanced emergency response
        response = bot.get_emergency_response(query.question)
        
        # Add city-specific enhancements if city was mentioned
        if mentioned_cities:
            city_name = mentioned_cities[0]
            city_data = bot.get_city_specific_data(city_name)
            
            # Add precise city information
            response += f"\n\n*PRECISE INFORMATION FOR {city_name.upper()}:*\n"
            
            if is_protection_request and city_data['safety']:
                response += f"*Available Protection in {city_name}:*\n"
                for facility in city_data['safety'][:3]:
                    response += f"- {facility['type'].upper()}: {facility['name']} at {facility['lat']}, {facility['lon']}\n"
            
            # ALWAYS include threat zones if they exist
            if city_data['threats']:
                response += f"\n*Threat Zones to Avoid in {city_name}:*\n"
                for threat in city_data['threats']:
                    response += f"- *{threat['threat_level']}*: {threat['type']} (Intensity: {threat['intensity']:.1f})\n"
            else:
                response += f"\n✅ No immediate threats detected in {city_name}\n"
        
        # Add general threat awareness if no city mentioned
        elif not mentioned_cities:
            response += "\n\n*💡 Tip:* Mention a specific city (e.g., 'Tel Aviv', 'Jerusalem') for precise local information."
        
        print(f"✅ Generated enhanced response: {response[:100]}...")
        return {
            "response": response,
            "context_type": query.context_type,
            "query_processed": query.question,
            "protection_request_detected": is_protection_request,
            "cities_mentioned": mentioned_cities,
            "analysis": {
                "is_protection_focused": is_protection_request,
                "cities_found": len(mentioned_cities),
                "response_enhanced": len(mentioned_cities) > 0
            }
        }
    except Exception as e:
        print(f"❌ Error processing question: {e}")
        # Return emergency fallback response
        fallback_response = (f"❌ Emergency system error: {e}\n\n"
                           "🚨 IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)")
        return {"response": fallback_response}

@app.post("/ask-simple")
async def ask_simple_question(query: Query):
    """Legacy endpoint for simple questions without context"""
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        response = bot.get_emergency_response(query.question)
        return {"response": response}
    except Exception as e:
        fallback_response = (f"❌ Emergency system error: {e}\n\n"
                           "🚨 IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)")
        return {"response": fallback_response}

@app.post("/nearest")
async def find_nearest_location(query: LocationQuery):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        print(f"📍 Finding nearest location for: {query.question} (type: {query.query_type})")
        
        if query.user_lat is None or query.user_lon is None:
            return {"response": "Please provide your coordinates (latitude and longitude) to find locations."}
        
        # Use the new contextual location finder
        locations = bot.find_contextual_locations(query.user_lat, query.user_lon, query.query_type)
        
        if not locations:
            return {"response": f"❌ No locations found for query type: {query.query_type}"}
        
        # Format response based on query type
        if query.query_type.lower() in ["safety", "shelter", "bunker", "embassy", "protection"]:
            response = f"*Nearest Safety Locations:*\n\n"
            for i, loc in enumerate(locations[:5], 1):
                response += f"{i}. *{loc['type'].upper()}* - {loc['name']}\n"
                response += f"   Distance: {loc['distance_km']} km\n"
                response += f"   GPS: {loc['lat']}, {loc['lon']}\n"
                if 'description' in loc:
                    response += f"   Info: {loc['description']}\n"
                response += "\n"
                
        elif query.query_type.lower() in ["danger", "threat", "risk", "avoid", "hazard"]:
            response = f"*Threat Assessment Report:*\n\n"
            for i, loc in enumerate(locations[:5], 1):
                response += f"{i}. *{loc['danger_level']} THREAT* - {loc['type'].upper()}\n"
                response += f"   Location: {loc['name']}\n"
                response += f"   Distance: {loc['distance_km']} km\n"
                response += f"   Intensity: {loc['intensity']:.1f}/1.0\n"
                response += f"   GPS: {loc['lat']}, {loc['lon']}\n\n"
                
        else:
            response = f"*Mixed Location Report:*\n\n"
            safety_count = sum(1 for loc in locations if loc['category'] == 'safety')
            danger_count = sum(1 for loc in locations if loc['category'] == 'danger')
            
            response += f"Found {safety_count} safety facilities and {danger_count} threat zones nearby.\n\n"
            
            # Show safety locations first
            response += "*Safety Facilities:*\n"
            safety_locs = [loc for loc in locations if loc['category'] == 'safety'][:3]
            for i, loc in enumerate(safety_locs, 1):
                response += f"{i}. {loc['type'].upper()} - {loc['name']} ({loc['distance_km']} km)\n"
            
            response += "\n*Threat Zones to Avoid:*\n"
            danger_locs = [loc for loc in locations if loc['category'] == 'danger'][:3]
            for i, loc in enumerate(danger_locs, 1):
                response += f"{i}. {loc['danger_level']} - {loc['type']} in {loc['name']} ({loc['distance_km']} km)\n"
        
        response += "\n*Emergency Contacts:*\nPolice: 100 | Medical: 101 | Fire: 102"
        
        return {
            "response": response,
            "query_type": query.query_type,
            "locations_found": len(locations),
            "locations": locations[:5]  # Return raw data for frontend use
        }
        
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
        # Basic statistics
        total_records = len(bot.df)
        data_types = bot.df['type'].value_counts().to_dict()
        sources = bot.df['source_file'].value_counts().to_dict() if 'source_file' in bot.df.columns else {}
        cities = bot.df['city'].value_counts().to_dict()
        
        # Categorize data types
        safety_types = ['bunker', 'shelter', 'embassy']
        danger_types = ['explosion', 'drone strike', 'car explosion', 'missile strike', 
                       'forces gathering', 'air strikes', 'soldiers spotted']
        
        safety_count = sum(data_types.get(t, 0) for t in safety_types)
        danger_count = sum(data_types.get(t, 0) for t in danger_types)
        other_count = total_records - safety_count - danger_count
        
        # Calculate threat intensity statistics for danger zones
        danger_df = bot.df[bot.df['type'].isin(danger_types)]
        intensity_stats = {}
        if not danger_df.empty and 'ins' in danger_df.columns:
            intensity_stats = {
                "average_intensity": float(danger_df['ins'].mean()),
                "max_intensity": float(danger_df['ins'].max()),
                "min_intensity": float(danger_df['ins'].min()),
                "critical_threats": len(danger_df[danger_df['ins'] >= 0.8]),
                "high_threats": len(danger_df[danger_df['ins'] >= 0.6]),
                "moderate_threats": len(danger_df[danger_df['ins'] >= 0.4]),
                "low_threats": len(danger_df[danger_df['ins'] < 0.4])
            }
        
        stats = {
            "overview": {
                "total_records": total_records,
                "safety_facilities": safety_count,
                "threat_zones": danger_count,
                "other_locations": other_count
            },
            "detailed_breakdown": {
                "data_types": data_types,
                "safety_facilities": {k: v for k, v in data_types.items() if k in safety_types},
                "threat_zones": {k: v for k, v in data_types.items() if k in danger_types}
            },
            "sources": sources,
            "geographic_distribution": {
                "total_cities": len(cities),
                "top_10_cities": dict(list(cities.items())[:10])
            },
            "threat_analysis": intensity_stats,
            "data_quality": {
                "missing_city_data": int(bot.df['city'].isna().sum()),
                "complete_records": int(bot.df.dropna().shape[0])
            }
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
          # Coverage analysis with intensity consideration
        safety_types = ['bunker', 'shelter', 'embassy']
        danger_types = ['explosion', 'drone strike', 'car explosion', 'missile strike', 
                       'forces gathering', 'air strikes', 'soldiers spotted']
        
        safety_facilities = sum(data_types.get(t, 0) for t in safety_types)
        threat_zones = sum(data_types.get(t, 0) for t in danger_types)
        
        # Analyze threat intensity if available
        threat_analysis = ""
        danger_df = bot.df[bot.df['type'].isin(danger_types)]
        if not danger_df.empty and 'ins' in danger_df.columns:
            critical_threats = len(danger_df[danger_df['ins'] >= 0.8])
            high_threats = len(danger_df[danger_df['ins'] >= 0.6])
            moderate_threats = len(danger_df[danger_df['ins'] >= 0.4])
            low_threats = len(danger_df[danger_df['ins'] < 0.4])
            avg_intensity = danger_df['ins'].mean()
            
            threat_analysis = f"""
*THREAT INTENSITY ANALYSIS:*
- Average Threat Level: {avg_intensity:.2f}/1.0
- Critical Threats (0.8+): {critical_threats} zones ({(critical_threats/len(danger_df)*100):.1f}%)
- High Threats (0.6-0.8): {high_threats} zones ({(high_threats/len(danger_df)*100):.1f}%)
- Moderate Threats (0.4-0.6): {moderate_threats} zones ({(moderate_threats/len(danger_df)*100):.1f}%)
- Low Threats (<0.4): {low_threats} zones ({(low_threats/len(danger_df)*100):.1f}%)"""
        
        report += f"\n\n*SAFETY COVERAGE ANALYSIS:*"
        report += f"\n- Protective Facilities: {safety_facilities} ({((safety_facilities/total_records)*100):.1f}%)"
        report += f"  - Bunkers: {data_types.get('bunker', 0)}"
        report += f"  - Shelters: {data_types.get('shelter', 0)}"
        report += f"  - Embassies: {data_types.get('embassy', 0)}"
        report += f"\n- Threat Zones: {threat_zones} ({((threat_zones/total_records)*100):.1f}%)"
        
        if threat_analysis:
            report += threat_analysis
        
        report += f"\n\n*EMERGENCY PREPAREDNESS:*"
        report += f"\n- Know your nearest bunker/shelter location"
        report += f"\n- Keep emergency contacts ready: Police 100, Medical 101, Fire 102"
        report += f"\n- Stay informed via Home Front Command alerts"
        report += f"\n- Maintain emergency supplies (water, food, first aid)"
        
        missing_cities = bot.df['city'].isna().sum()
        if missing_cities > 0:
            report += f"\n\n*DATA QUALITY NOTES:*"
            report += f"\n- {missing_cities} records missing city information"
        
        return {"response": report}
        
    except Exception as e:
        print(f"❌ Error generating mix report: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@app.post("/threat-assessment")
async def threat_assessment(query: LocationQuery):
    """Provide comprehensive threat assessment for a location"""
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        print(f"🔍 Threat assessment for: {query.question}")
        
        if query.user_lat is None or query.user_lon is None:
            return {"response": "Please provide coordinates for threat assessment."}
        
        # Get all nearby locations for comprehensive assessment
        all_locations = bot.find_contextual_locations(query.user_lat, query.user_lon, "general")
        
        # Separate by category
        safety_locations = [loc for loc in all_locations if loc['category'] == 'safety']
        danger_locations = [loc for loc in all_locations if loc['category'] == 'danger']
        
        # Calculate overall threat level
        if danger_locations:
            max_intensity = max(loc.get('intensity', 0) for loc in danger_locations)
            closest_danger = min(loc['distance_km'] for loc in danger_locations)
            
            if max_intensity >= 0.8 and closest_danger <= 5:
                overall_threat = "CRITICAL"
            elif max_intensity >= 0.6 and closest_danger <= 10:
                overall_threat = "HIGH"
            elif max_intensity >= 0.4 and closest_danger <= 20:
                overall_threat = "MODERATE"
            else:
                overall_threat = "LOW"
        else:
            overall_threat = "MINIMAL"
        
        # Generate comprehensive report
        report = f"""*COMPREHENSIVE THREAT ASSESSMENT*
Location: {query.user_lat:.4f}, {query.user_lon:.4f}

*OVERALL THREAT LEVEL: {overall_threat}*

*IMMEDIATE SAFETY FACILITIES:*"""
        
        if safety_locations:
            for i, loc in enumerate(safety_locations[:3], 1):
                report += f"\n{i}. {loc['type'].upper()} - {loc['name']}"
                report += f"\n   Distance: {loc['distance_km']} km | GPS: {loc['lat']}, {loc['lon']}"
        else:
            report += "\n⚠️ No immediate safety facilities found"
        
        report += f"\n\n*THREAT ZONES TO AVOID:*"
        
        if danger_locations:
            for i, loc in enumerate(danger_locations[:5], 1):
                report += f"\n{i}. *{loc['danger_level']}* - {loc['type'].upper()}"
                report += f"\n   Location: {loc['name']}"
                report += f"\n   Distance: {loc['distance_km']} km"
                report += f"\n   Intensity: {loc['intensity']:.1f}/1.0"
        else:
            report += "\n✅ No immediate threats detected"
        
        # Add recommendations
        report += f"\n\n*RECOMMENDATIONS:*"
        if overall_threat == "CRITICAL":
            report += "\n- EVACUATE IMMEDIATELY to nearest bunker"
            report += "\n- Call 100 (Police) for immediate assistance"
            report += "\n- Avoid all high-intensity zones"
        elif overall_threat == "HIGH":
            report += "\n- Proceed to nearest shelter immediately"
            report += "\n- Avoid marked danger zones"
            report += "\n- Stay alert for emergency alerts"
        elif overall_threat == "MODERATE":
            report += "\n- Know location of nearest bunker/shelter"
            report += "\n- Monitor situation closely"
            report += "\n- Avoid moderate+ threat zones"
        else:
            report += "\n- Maintain normal caution"
            report += "\n- Stay informed of developments"
            report += "\n- Keep emergency contacts ready"
        
        report += f"\n\n*Emergency Contacts:* Police 100 | Medical 101 | Fire 102"
        
        return {
            "response": report,
            "overall_threat_level": overall_threat,
            "safety_facilities_count": len(safety_locations),
            "threat_zones_count": len(danger_locations),
            "max_threat_intensity": max((loc.get('intensity', 0) for loc in danger_locations), default=0),
            "closest_safety_distance": min((loc['distance_km'] for loc in safety_locations), default=999) if safety_locations else None,
            "closest_danger_distance": min((loc['distance_km'] for loc in danger_locations), default=999) if danger_locations else None
        }
        
    except Exception as e:
        print(f"❌ Error in threat assessment: {e}")
        raise HTTPException(status_code=500, detail=f"Threat assessment failed: {str(e)}")

@app.post("/city-info")
async def get_city_info(query: LocationQuery):
    """Get comprehensive information for a specific city"""
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        # Extract city from question
        cities = bot.extract_city_from_query(query.question)
        
        if not cities:
            return {
                "response": "Please specify a city name in your question. For example: 'What safety facilities are in Tel Aviv?'",
                "available_cities": bot.df['city'].dropna().unique().tolist()[:20] if bot.df is not None else []
            }
        
        city_name = cities[0]  # Use first mentioned city
        city_data = bot.get_city_specific_data(city_name)
        
        # Generate comprehensive city report
        report = f"*COMPREHENSIVE CITY REPORT: {city_name.upper()}*\n\n"
        
        # Safety facilities
        if city_data['safety']:
            report += f"*SAFETY FACILITIES ({len(city_data['safety'])} found):*\n"
            for i, facility in enumerate(city_data['safety'], 1):
                report += f"{i}. *{facility['type'].upper()}* - {facility['name']}\n"
                report += f"   GPS: {facility['lat']}, {facility['lon']}\n"
                if facility['description']:
                    report += f"   Details: {facility['description']}\n"
                report += "\n"
        else:
            report += "*SAFETY FACILITIES:*\n⚠️ No bunkers, shelters, or embassies found in this city\n\n"
        
        # Threat zones
        if city_data['threats']:
            report += f"*THREAT ZONES TO AVOID ({len(city_data['threats'])} found):*\n"
            for i, threat in enumerate(city_data['threats'], 1):
                report += f"{i}. *{threat['threat_level']} THREAT* - {threat['type'].upper()}\n"
                report += f"   Location: {threat['name']}\n"
                report += f"   Intensity: {threat['intensity']:.1f}/1.0\n"
                report += f"   GPS: {threat['lat']}, {threat['lon']}\n\n"
        else:
            report += "*THREAT ASSESSMENT:*\n✅ No immediate threats detected in this city\n\n"
        
        # City-specific recommendations
        threat_count = len(city_data['threats'])
        safety_count = len(city_data['safety'])
        
        report += "*CITY-SPECIFIC RECOMMENDATIONS:*\n"
        if threat_count > 0:
            high_threats = sum(1 for t in city_data['threats'] if t['intensity'] >= 0.6)
            if high_threats > 0:
                report += f"⚠️ HIGH ALERT: {high_threats} high-intensity threats in {city_name}\n"
                report += "- Avoid marked danger zones completely\n"
                report += "- Stay close to available safety facilities\n"
            else:
                report += f"- Monitor {threat_count} threat zones in the area\n"
        
        if safety_count > 0:
            report += f"- {safety_count} safety facilities available for protection\n"
            report += "- Memorize nearest facility location and route\n"
        else:
            report += "- No safety facilities in this city - consider nearby cities\n"
        
        report += "\n*Emergency Contacts:* Police 100 | Medical 101 | Fire 102"
        
        return {
            "response": report,
            "city": city_name,
            "safety_facilities_count": safety_count,
            "threat_zones_count": threat_count,
            "safety_facilities": city_data['safety'],
            "threat_zones": city_data['threats'],
            "overall_safety_score": max(0, 10 - (threat_count * 2) + safety_count) if threat_count > 0 else (10 if safety_count > 0 else 5)
        }
        
    except Exception as e:
        print(f"❌ Error getting city info: {e}")
        raise HTTPException(status_code=500, detail=f"City information retrieval failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Israel Emergency Safety Bot API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
