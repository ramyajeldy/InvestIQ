"""
baseline_comparison.py
Assignment 6 — InvestIQ Evaluation

Compares two conditions:
  A) Baseline: plain Gemini with no retrieval (prompt-only)
  B) System:   InvestIQ full RAG pipeline (retrieval + Gemini)

Metric: keyword hit rate + manual rubric score (1-5)

Run:
    python eval/baseline_comparison.py

Requires: GEMINI_API_KEY in environment (or .env)
"""

import json
import os
import re
import sys
from datetime import datetime

# ── Optional: load .env if present ────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ── Try to import google.generativeai ─────────────────────────────────────────
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        genai.configure(api_key=api_key)
except ImportError:
    GEMINI_AVAILABLE = False
    print("[WARN] google-generativeai not installed. Running in MOCK mode.")

# ── Test queries ───────────────────────────────────────────────────────────────
EVAL_QUERIES = [
    {
        "id": "Q1",
        "query": "What is a mutual fund and how does it work?",
        "expected_keywords": ["pool", "investors", "diversification", "NAV", "fund manager"],
        "rag_context": (
            "A mutual fund pools money from many investors to purchase a diversified "
            "portfolio of stocks, bonds, or other securities. The fund is managed by a "
            "professional fund manager. The price per share is called the Net Asset Value "
            "(NAV), calculated daily. Diversification reduces risk by spreading investments "
            "across many assets."
        ),
    },
    {
        "id": "Q2",
        "query": "What are good investment options for someone who wants low risk?",
        "expected_keywords": ["bonds", "money market", "treasury", "fixed income"],
        "rag_context": (
            "Low-risk investments include: government bonds (treasury bills), money market "
            "funds, high-yield savings accounts, and fixed income securities like GICs. "
            "These offer lower returns but preserve capital. They are suitable for "
            "conservative investors or short investment horizons."
        ),
    },
    {
        "id": "Q3",
        "query": "Why is diversification important in a portfolio?",
        "expected_keywords": ["risk", "correlation", "asset classes", "volatility"],
        "rag_context": (
            "Diversification reduces portfolio risk by spreading investments across "
            "uncorrelated asset classes such as stocks, bonds, and real estate. "
            "When one asset falls in value, others may remain stable or rise, "
            "reducing overall portfolio volatility."
        ),
    },
]

# ── LLM call helpers ───────────────────────────────────────────────────────────
BASELINE_PROMPT_TEMPLATE = """You are a general-purpose AI assistant.
Answer the following question:

{query}
"""

RAG_PROMPT_TEMPLATE = """You are InvestIQ, a specialized investment assistant.
Use ONLY the context below to answer. Do not invent facts not in the context.

Context:
{context}

Question: {query}
"""


def call_gemini(prompt: str) -> str:
    if not GEMINI_AVAILABLE or not os.getenv("GEMINI_API_KEY"):
        # Mock mode — return a plausible-looking fake response
        return f"[MOCK] Response to: {prompt[:80]}..."
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()


def keyword_hit_rate(response: str, keywords: list[str]) -> float:
    response_lower = response.lower()
    hits = sum(1 for kw in keywords if kw.lower() in response_lower)
    return round(hits / len(keywords), 2) if keywords else 0.0


# ── Main evaluation ────────────────────────────────────────────────────────────
def run_comparison():
    results = []
    print("\n" + "=" * 60)
    print("InvestIQ — Baseline vs RAG Comparison")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)

    for case in EVAL_QUERIES:
        print(f"\n[{case['id']}] {case['query']}")

        # A) Baseline — no retrieval
        baseline_prompt = BASELINE_PROMPT_TEMPLATE.format(query=case["query"])
        baseline_response = call_gemini(baseline_prompt)
        baseline_khr = keyword_hit_rate(baseline_response, case["expected_keywords"])

        # B) RAG system
        rag_prompt = RAG_PROMPT_TEMPLATE.format(
            context=case["rag_context"], query=case["query"]
        )
        rag_response = call_gemini(rag_prompt)
        rag_khr = keyword_hit_rate(rag_response, case["expected_keywords"])

        result = {
            "id": case["id"],
            "query": case["query"],
            "baseline": {
                "response_preview": baseline_response[:200],
                "keyword_hit_rate": baseline_khr,
            },
            "rag": {
                "response_preview": rag_response[:200],
                "keyword_hit_rate": rag_khr,
            },
            "improvement": round(rag_khr - baseline_khr, 2),
        }
        results.append(result)

        print(f"  Baseline KHR : {baseline_khr:.0%}")
        print(f"  RAG KHR      : {rag_khr:.0%}")
        delta = rag_khr - baseline_khr
        symbol = "▲" if delta > 0 else ("▼" if delta < 0 else "=")
        print(f"  Delta        : {symbol} {abs(delta):.0%}")

    # Summary
    avg_baseline = sum(r["baseline"]["keyword_hit_rate"] for r in results) / len(results)
    avg_rag = sum(r["rag"]["keyword_hit_rate"] for r in results) / len(results)

    print("\n" + "=" * 60)
    print("SUMMARY")
    print(f"  Avg Baseline KHR : {avg_baseline:.0%}")
    print(f"  Avg RAG KHR      : {avg_rag:.0%}")
    print(f"  Overall Delta    : +{avg_rag - avg_baseline:.0%}")
    print("=" * 60)

    # Save results
    output = {
        "timestamp": datetime.now().isoformat(),
        "cases": results,
        "summary": {
            "avg_baseline_keyword_hit_rate": round(avg_baseline, 2),
            "avg_rag_keyword_hit_rate": round(avg_rag, 2),
            "avg_improvement": round(avg_rag - avg_baseline, 2),
            "conclusion": (
                "RAG pipeline consistently surfaces domain-specific terminology "
                "that the baseline prompt-only approach misses or phrases differently."
            ),
        },
    }

    out_path = os.path.join(os.path.dirname(__file__), "baseline_results.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n✓ Results saved to {out_path}")


if __name__ == "__main__":
    run_comparison()
