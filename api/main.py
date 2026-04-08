import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from api.chat_service import process_chat_question
from api.config import SUPPORTED_QUESTIONS, SUPPORTED_ASSETS, SUPPORTED_WINDOWS
from api.market_snapshot import build_market_snapshot_response, load_market_snapshot

load_dotenv()

# Readiness state
state = {
    "ready": False,
    "market_data_ready": False,
    "vector_store_ready": False
}

def startup():
    print("InvestIQ API starting up...")

    # Load Chroma from local files (committed to repo)
    try:
        from api.retriever import get_chroma_collection
        get_chroma_collection()
        state["vector_store_ready"] = True
        print("Vector store ready")
    except Exception as e:
        print(f"Vector store not ready: {e}")

    # Load market data from local gold file
    try:
        data = load_market_snapshot()
        if data and data.get("assets"):
            state["market_data_ready"] = True
            print("Market data ready")
    except Exception as e:
        print(f"Market data not ready: {e}")

    state["ready"] = state["vector_store_ready"] or state["market_data_ready"]
    print(f"API ready: {state}")

# Run startup immediately on import
startup()

app = FastAPI(title="InvestIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

@app.get("/")
def root():
    return {"message": "InvestIQ API is running", "version": "1.0.2"}

@app.get("/health")
def health():
    return {
        "status": "ok" if state["ready"] else "warming_up",
        "ready": state["ready"],
        "market_data_ready": state["market_data_ready"],
        "vector_store_ready": state["vector_store_ready"]
    }

@app.get("/supported-questions")
def supported_questions():
    return {
        "questions": SUPPORTED_QUESTIONS,
        "assets": SUPPORTED_ASSETS,
        "windows": SUPPORTED_WINDOWS
    }

@app.get("/market-snapshot")
def market_snapshot(window: str = "7d"):
    data = load_market_snapshot()
    if not data:
        return {"error": "Market data unavailable"}
    return build_market_snapshot_response(data, window)

@app.post("/chat")
def chat(request: QuestionRequest):
    try:
        return process_chat_question(request.question, state["ready"])
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"CHAT ERROR: {error_detail}")
        return {
            "answer": f"An error occurred: {str(e)}",
            "sources": [],
            "route": "error"
        }
