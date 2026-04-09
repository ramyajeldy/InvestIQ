import os
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from api.chat_service import process_chat_question
from api.config import SUPPORTED_QUESTIONS, SUPPORTED_ASSETS, SUPPORTED_WINDOWS
from api.market_snapshot import build_market_snapshot_response, load_market_snapshot

# ── Simple in-memory cache ──────────────────────────────────
_cache = {}
CACHE_TTL = 3600   # 1 hour
MAX_CACHE = 20

def get_cached(question: str):
    key = question.lower().strip()
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["ts"] < CACHE_TTL:
            print(f"Cache HIT for: {key[:50]}")
            return {k: v for k, v in entry.items() if k != "ts"}
    return None

def set_cached(question: str, data: dict):
    key = question.lower().strip()
    if len(_cache) >= MAX_CACHE:
        oldest = min(_cache, key=lambda k: _cache[k]["ts"])
        del _cache[oldest]
    _cache[key] = {**data, "ts": time.time(), "cached": True}
    print(f"Cache SET for: {key[:50]}")

# ── Load env ────────────────────────────────────────────────
load_dotenv()

# ── Readiness state ─────────────────────────────────────────
state = {
    "ready": False,
    "market_data_ready": False,
    "vector_store_ready": False
}

def startup():
    print("InvestIQ API starting up...")

    # Pre-load ChromaDB vector store
    try:
        from api.retriever import get_chroma_collection
        get_chroma_collection()
        state["vector_store_ready"] = True
        print("Vector store ready")
    except Exception as e:
        print(f"Vector store not ready: {e}")

    # Pre-load market data
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

# ── App ─────────────────────────────────────────────────────
app = FastAPI(title="InvestIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuestionRequest(BaseModel):
    question: str

# ── Routes ──────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "InvestIQ API is running", "version": "1.0.3"}

@app.get("/health")
def health():
    return {
        "status": "ok" if state["ready"] else "warming_up",
        "ready": state["ready"],
        "market_data_ready": state["market_data_ready"],
        "vector_store_ready": state["vector_store_ready"],
        "cache_size": len(_cache)
    }

@app.get("/warmup")
async def warmup():
    """Keep-alive endpoint — ping this every 10 min to prevent Render cold starts."""
    return {
        "status": "warm",
        "message": "InvestIQ API is ready",
        "ready": state["ready"],
        "cache_size": len(_cache)
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
        # ── 1. Check cache first ────────────────────────────
        cached = get_cached(request.question)
        if cached:
            return cached

        # ── 2. Process normally ─────────────────────────────
        result = process_chat_question(request.question, state["ready"])

        # ── 3. Cache the result if it's a good answer ───────
        route = result.get("route", "")
        if route not in ("error", "unsupported"):
            set_cached(request.question, result)

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