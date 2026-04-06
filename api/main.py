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

# Readiness state — from grill-me Q28
state = {
    "ready": False,
    "market_data_ready": False,
    "vector_store_ready": False
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — load Chroma and verify market data
    print("InvestIQ API starting up...")
    try:
        from api.retriever import get_chroma_collection
        get_chroma_collection()
        state["vector_store_ready"] = True
        print("Vector store ready")
    except Exception as e:
        print(f"Vector store not ready: {e}")

    try:
        data = retrieve_market_data()
        if data and data.get("assets"):
            state["market_data_ready"] = True
            print("Market data ready")
    except Exception as e:
        print(f"Market data not ready: {e}")

    state["ready"] = state["vector_store_ready"] or state["market_data_ready"]
    print(f"API ready: {state}")
    yield
    print("InvestIQ API shutting down...")

app = FastAPI(title="InvestIQ API", lifespan=lifespan)

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
    return {"message": "InvestIQ API is running"}

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
def market_snapshot():
    data = retrieve_market_data()
    if not data:
        return {"error": "Market data unavailable"}
    return data

@app.post("/chat")
def chat(request: QuestionRequest):
    question = request.question.strip()

    if not question:
        return {"error": "Question cannot be empty"}

    # Cold start check
    if not state["ready"]:
        return {
            "answer": "Knowledge base is warming up, please try again in a moment.",
            "sources": [],
            "route": "warming_up"
        }

    # Classify
    classification = classify_question(question)
    route = classification["route"]
    assets = classification["assets"]
    window = classification["window"]

    print(f"Question: {question}")
    print(f"Route: {route} | Assets: {assets} | Window: {window}")

    # Retrieve
    chunks = []
    market_data = {}

    if route in ["document", "mixed"]:
        chunks = retrieve_documents(question)

    if route in ["market_data", "mixed"]:
        market_data = retrieve_market_data(assets if assets else None)

    # Respond
    result = respond(question, route, chunks, market_data)
    return result