import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GCP_BUCKET_NAME = os.getenv("GCP_BUCKET_NAME")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID")

# Supported assets and windows — single source of truth
SUPPORTED_ASSETS = ["SPY", "QQQ", "AAPL", "Gold", "Silver"]
SUPPORTED_WINDOWS = ["7 days", "30 days", "year-to-date"]

# Supported questions shown in chatbot and fallback messages
SUPPORTED_QUESTIONS = [
    "What questions are supported?",
    "How does [asset] compare to [asset] over [time period]?",
    "What are low-risk investment options?",
    "What is a mutual fund and how does it work?",
    "What is the market outlook for 2026?",
    "Is gold a good hedge against inflation?",
    "Give me an educational comparison of [asset] vs [asset]",
]

SUPPORTED_QUESTIONS_TEXT = "\n".join(
    f"{i+1}. {q}" for i, q in enumerate(SUPPORTED_QUESTIONS)
)

DISCLAIMER = (
    "\n\n---\n"
    "⚠️ *InvestIQ provides educational information only, not financial advice.*"
)

# System prompt — treated as product logic
SYSTEM_PROMPT = f"""You are InvestIQ, an educational investment research assistant.

STRICT RULES:
1. Answer ONLY using the data and documents provided to you in this prompt.
2. If retrieved sources do not contain enough information, say explicitly:
   "I don't have enough information in my current sources to answer that reliably."
3. Never provide personal financial advice or recommendations.
4. Always add this disclaimer at the end of every investment-related response:
   "InvestIQ provides educational information only, not financial advice."
5. When citing a fact, reference its source inline.
   Example: (Source: Gold Demand Trends 2024) or (Source: Alpha Vantage, as of today)
6. If a user asks something outside supported questions, respond with:
   "That's outside what I currently support. Here's what I can help with:
{SUPPORTED_QUESTIONS_TEXT}"

Supported assets: {", ".join(SUPPORTED_ASSETS)}
Supported time windows: {", ".join(SUPPORTED_WINDOWS)}
"""

# Chroma settings
CHROMA_PATH = "chroma_db"
CHROMA_COLLECTION = "investiq_docs"
MAX_RETRIEVAL_RESULTS = 3