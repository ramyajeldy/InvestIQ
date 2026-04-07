import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from api.classifier import classify_question
from api.retriever import retrieve_documents, retrieve_market_data
from api.responder import respond
from api.config import SUPPORTED_QUESTIONS, SUPPORTED_ASSETS, SUPPORTED_WINDOWS

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
        import json
        gold_path = "data/gold/market_snapshot.json"
        if os.path.exists(gold_path):
            with open(gold_path, "r") as f:
                data = json.load(f)
            if data and data.get("assets"):
                state["market_data_ready"] = True
                print("Market data ready")
        else:
            print("Gold file not found locally")
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
    data = retrieve_market_data()
    if not data:
        return {"error": "Market data unavailable"}

    assets = data.get("assets", {})
    result = {}

    for name, asset in assets.items():
        if asset is None:
            continue
        if window == "7d":
            change = asset.get("change_7d") or asset.get("change_percent", 0)
        elif window == "30d":
            change = asset.get("change_30d") or asset.get("change_percent", 0)
        elif window == "ytd":
            change = asset.get("change_ytd") or asset.get("change_percent", 0)
        else:
            change = asset.get("change_7d") or asset.get("change_percent", 0)

        result[name] = {
            "symbol": asset.get("symbol", name),
            "name": name,
            "price": asset.get("price"),
            "change": change,
            "change_7d": asset.get("change_7d"),
            "change_30d": asset.get("change_30d"),
            "change_ytd": asset.get("change_ytd"),
            "history": asset.get("history", {}),
            "latest_trading_day": asset.get("latest_trading_day") or asset.get("transformed_at"),
            "asset_type": asset.get("asset_type"),
            "updated_at": data.get("updated_at")
        }

    return {"assets": result, "window": window, "updated_at": data.get("updated_at")}

@app.post("/chat")
def chat(request: QuestionRequest):
    try:
        question = request.question.strip()
        if not question:
            return {"answer": "Question cannot be empty", "sources": [], "route": "error"}

        if not state["ready"]:
            return {
                "answer": "Knowledge base is warming up, please try again in a moment.",
                "sources": [],
                "route": "warming_up"
            }

        classification = classify_question(question)
        route = classification["route"]
        assets = classification["assets"]
        window = classification["window"]

        print(f"Question: {question}")
        print(f"Route: {route} | Assets: {assets} | Window: {window}")

        chunks = []
        market_data = {}

        if route in ["document", "mixed"]:
            chunks = retrieve_documents(question)

        if route in ["market_data", "mixed"]:
            market_data = retrieve_market_data(assets if assets else None)

        result = respond(question, route, chunks, market_data)
        return result

    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"CHAT ERROR: {error_detail}")
        return {
            "answer": f"An error occurred: {str(e)}",
            "sources": [],
            "route": "error"
        }