import re
from api.config import SUPPORTED_ASSETS, SUPPORTED_WINDOWS, SUPPORTED_QUESTIONS_TEXT

def classify_question(question: str) -> dict:
    q = question.lower().strip()

    # Question 1: What questions are supported?
    if any(phrase in q for phrase in [
        "what questions", "what can you", "what do you support",
        "help me with", "what are you able"
    ]):
        return {
            "route": "supported_list",
            "confidence": "high",
            "assets": [],
            "window": None
        }

    # Detect assets mentioned
    mentioned_assets = [
        asset for asset in SUPPORTED_ASSETS
        if asset.lower() in q
    ]

    # Detect time window mentioned
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

    # Question 2 & 7: Compare assets
    if any(phrase in q for phrase in ["compare", "vs", "versus", "against", "better"]):
        if len(mentioned_assets) >= 1:
            return {
                "route": "mixed",
                "confidence": "high",
                "assets": mentioned_assets,
                "window": mentioned_window or "30 days"
            }

    # Question 3: Low risk options
    if any(phrase in q for phrase in ["low-risk", "low risk", "safe investment", "conservative"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None
        }

    # Question 4: Mutual fund
    if any(phrase in q for phrase in ["mutual fund", "what is a fund", "how does a fund"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None
        }

    # Question 5: Market outlook
    if any(phrase in q for phrase in ["market outlook", "outlook for 2026", "2026 outlook", "forecast"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None
        }

    # Question 6: Gold hedge
    if any(phrase in q for phrase in ["hedge", "inflation", "gold hedge", "safe haven"]):
        return {
            "route": "document",
            "confidence": "high",
            "assets": [],
            "window": None
        }

    # Market data only — asset mentioned but no document needed
    if mentioned_assets and not any(phrase in q for phrase in [
        "what is", "how does", "explain", "tell me about", "why"
    ]):
        return {
            "route": "market_data",
            "confidence": "medium",
            "assets": mentioned_assets,
            "window": mentioned_window or "30 days"
        }

    # Unsupported
    return {
        "route": "unsupported",
        "confidence": "low",
        "assets": [],
        "window": None
    }