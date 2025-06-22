# api_server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chatbot import IsraelSafetyRAGBot
import uvicorn

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

@app.get("/")
async def root():
    if not bot or bot.df is None:
        return {
            "message": "Israel Emergency Safety Bot API", 
            "status": "error - bot not initialized",
            "endpoints": ["/ask", "/summary", "/emergency"]
        }
    
    return {
        "message": "Israel Emergency Safety Bot API - Ready", 
        "status": "ready",
        "total_locations": len(bot.df),
        "endpoints": {
            "/ask": "Ask any emergency safety question",
            "/summary": "Get overall safety summary",
            "/emergency": "Emergency protocols"
        }
    }

@app.post("/ask")
async def ask_question(query: Query):
    """Simple AI-powered emergency response"""
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        print(f"📝 Question: {query.question}")
        
        # Let the AI handle everything - no complex logic
        response = bot.get_emergency_response(query.question)
        
        print(f"✅ Response generated")
        return {"response": response}
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return {
            "response": f"❌ Emergency system error: {e}\n\n🚨 IMMEDIATE ACTION: Call emergency services 100 (Police), 101 (Medical)"
        }

@app.get("/summary")
async def get_summary():
    """Simple overall safety summary"""
    if not bot or bot.df is None:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    try:
        # Simple summary using AI
        summary_query = "Give me an overall summary of the safety situation in Israel with key recommendations"
        response = bot.get_emergency_response(summary_query)
        
        return {"response": response}
        
    except Exception as e:
        return {
            "response": f"❌ Error generating summary: {e}\n\n🚨 Call emergency services 100 (Police), 101 (Medical)"
        }

@app.get("/emergency")
async def emergency_help():
    """Emergency protocols"""
    if not bot:
        raise HTTPException(status_code=500, detail="Bot is not initialized")
    
    help_response = bot._handle_emergency_command()
    return {"response": help_response}

if __name__ == "__main__":
    print("🚀 Starting Simple Israel Emergency Safety Bot API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
