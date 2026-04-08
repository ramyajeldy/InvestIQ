import re

from api.config import SUPPORTED_ASSETS, SUPPORTED_WINDOWS


FINANCIAL_TERMS = [
    "investment",
    "invest",
    "investing",
    "dollar cost",
    "compound interest",
    "compound",
    "interest",
    "etf",
    "index fund",
    "stock market",
    "portfolio",
    "return",
    "returns",
    "yield",
    "dividend",
    "bear market",
    "bull market",
    "recession",
    "volatility",
    "risk",
    "reward",
    "asset allocation",
    "rebalance",
    "401k",
    "ira",
    "roth",
    "retirement",
    "mutual fund",
    "fund",
    "inflation",
    "hedge",
    "market outlook",
]

DOCUMENT_KEYWORDS = [
    "long-term",
    "long term",
    "good investment",
    "should i invest",
    "dollar cost",
    "compound interest",
    "compound",
    "interest",
    "etf",
    "index fund",
    "stock market",
    "portfolio",
    "return",
    "returns",
    "yield",
    "dividend",
    "bear market",
    "bull market",
    "recession",
    "volatility",
    "risk",
    "reward",
    "asset allocation",
    "rebalance",
    "401k",
    "ira",
    "roth",
    "retirement",
]

EXPLANATION_PROMPTS = ["what is", "how does", "explain", "tell me about"]
ASSET_QUESTION_WORDS = ["what", "how", "why", "good", "should", "is", "explain"]


def contains_phrase(text: str, phrase: str) -> bool:
    if " " in phrase or "-" in phrase:
        return phrase in text

    return re.search(rf"\b{re.escape(phrase)}\b", text) is not None


def llm_fallback_classify(question: str) -> dict:
    try:
        from google import genai
        import json
        import os

        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        prompt = f"""You are a question classifier for an investment research assistant.

Classify this question into one of these routes:
- "document" - question is about investment concepts, market outlook, funds, gold, inflation, risk, stocks, ETFs, bonds, diversification, long-term investing, or beginner financial education
- "market_data" - question asks for specific live prices or performance of SPY, QQQ, AAPL, Gold, or Silver
- "mixed" - question needs both live data and educational context
- "unsupported" - question is completely unrelated to investing

When in doubt between document and unsupported, choose document.
Only use unsupported for clearly non-investment topics like weather, sports, cooking, or personal questions.

Question: "{question}"

Reply with ONLY a JSON object like this:
{{"route": "document", "reason": "brief reason"}}

No explanation, no markdown, just the JSON."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        route = result.get("route") or "document"
        if route == "unsupported":
            route = "document"
        print(f"LLM fallback classified as: {route} - {result.get('reason', '')}")
        return {
            "route": route,
            "confidence": "llm",
            "assets": [],
            "window": None,
        }
    except Exception as e:
        print(f"LLM fallback error: {e}")
        return {
            "route": "document",
            "confidence": "low",
            "assets": [],
            "window": None,
        }


def classify_question(question: str) -> dict:
    q = question.lower().strip()

    if any(
        phrase in q
        for phrase in [
            "what questions",
            "what can you",
            "what do you support",
            "help me with",
            "what are you able",
        ]
    ):
        return {
            "route": "supported_list",
            "confidence": "high",
            "assets": [],
            "window": None,
        }

    mentioned_assets = [
        asset for asset in SUPPORTED_ASSETS if asset.lower() in q
    ]

    mentioned_window = None
    for window in SUPPORTED_WINDOWS:
        if window.lower() in q:
            mentioned_window = window
            break
    if "7 day" in q or "week" in q:
        mentioned_window = "7 days"
    elif "30 day" in q or "month" in q:
        mentioned_window = "30 days"
    elif "year" in q or "ytd" in q:
        mentioned_window = "year-to-date"

    if any(phrase in q for phrase in ["compare", "vs", "versus", "against", "better"]):
        if len(mentioned_assets) >= 1:
            return {
                "route": "mixed",
                "confidence": "high",
                "assets": mentioned_assets,
                "window": mentioned_window or "30 days",
            }

    if any(
        phrase in q
        for phrase in ["low-risk", "low risk", "safe investment", "conservative"]
    ):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None,
        }

    if any(phrase in q for phrase in ["mutual fund", "what is a fund", "how does a fund"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None,
        }

    if any(
        phrase in q
        for phrase in ["market outlook", "outlook for 2026", "2026 outlook", "forecast"]
    ):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None,
        }

    if any(phrase in q for phrase in ["hedge", "inflation", "gold hedge", "safe haven"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None,
        }

    if any(phrase in q for phrase in ["diversification", "diversify", "portfolio allocation"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None,
        }

    if any(contains_phrase(q, keyword) for keyword in DOCUMENT_KEYWORDS):
        return {
            "route": "document",
            "confidence": "high",
            "assets": mentioned_assets,
            "window": mentioned_window,
        }

    if any(prompt in q for prompt in EXPLANATION_PROMPTS) and any(
        contains_phrase(q, term) for term in FINANCIAL_TERMS
    ):
        return {
            "route": "document",
            "confidence": "high",
            "assets": mentioned_assets,
            "window": mentioned_window,
        }

    if mentioned_assets and any(contains_phrase(q, word) for word in ASSET_QUESTION_WORDS):
        return {
            "route": "mixed",
            "confidence": "high",
            "assets": mentioned_assets,
            "window": mentioned_window or "30 days",
        }

    if mentioned_assets:
        return {
            "route": "market_data",
            "confidence": "medium",
            "assets": mentioned_assets,
            "window": mentioned_window or "30 days",
        }

    return llm_fallback_classify(question)
