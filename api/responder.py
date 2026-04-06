from google import genai
from api.config import (
    GEMINI_API_KEY, SYSTEM_PROMPT, DISCLAIMER,
    SUPPORTED_QUESTIONS_TEXT
)

def build_context(chunks: list, market_data: dict) -> str:
    context_parts = []

    if market_data and market_data.get("assets"):
        context_parts.append("=== LIVE MARKET DATA ===")
        for name, data in market_data["assets"].items():
            if data:
                price = data.get('price', 'N/A')
                change = data.get('change_percent', 'N/A')
                date = data.get('latest_trading_day') or data.get('transformed_at', 'N/A')
                asset_type = data.get('asset_type', 'asset')
                note = data.get('note', '')
                context_parts.append(
                    f"{name} ({asset_type}): Price=${price} | "
                    f"Change={change}% | As of={date}"
                    + (f" | Note: {note}" if note else "")
                )
        context_parts.append(f"Data updated: {market_data.get('updated_at', 'N/A')}")
        context_parts.append("")
        context_parts.append(
            "Use this market data to directly compare the assets. "
            "Calculate which performed better based on the change percentages."
        )
        context_parts.append("")

    if chunks:
        context_parts.append("=== RETRIEVED DOCUMENT SOURCES ===")
        for i, chunk in enumerate(chunks):
            meta = chunk.get("metadata", {})
            context_parts.append(
                f"[Source {i+1}: {meta.get('title', 'Unknown')} "
                f"({meta.get('source', 'Unknown')})]"
            )
            context_parts.append(chunk["text"])
            context_parts.append("")

    return "\n".join(context_parts)

def call_gemini(prompt: str) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text

def respond(question: str, route: str, chunks: list, market_data: dict) -> dict:

    # Handle supported list
    if route == "supported_list":
        return {
            "answer": f"Here are the questions I can help with:\n\n{SUPPORTED_QUESTIONS_TEXT}",
            "sources": [],
            "route": route
        }

    # Handle unsupported
    if route == "unsupported":
        return {
            "answer": (
                f"That's outside what I currently support.\n\n"
                f"Here's what I can help with:\n\n{SUPPORTED_QUESTIONS_TEXT}"
            ),
            "sources": [],
            "route": route
        }

    # Build context from retrieved data
    context = build_context(chunks, market_data)

    if not context.strip():
        return {
            "answer": (
                "I don't have enough information in my current sources "
                "to answer that reliably." + DISCLAIMER
            ),
            "sources": [],
            "route": route
        }

    # Build full prompt
    prompt = f"""{SYSTEM_PROMPT}

=== USER QUESTION ===
{question}

=== AVAILABLE CONTEXT ===
{context}

Please answer the question using only the context provided above.
Include inline citations and end with a Sources used section.
"""

    answer = call_gemini(prompt)
    answer += DISCLAIMER

    # Build sources list
    sources = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        title = meta.get("title", "Unknown")
        if title not in sources:
            sources.append(title)

    if market_data and market_data.get("assets"):
        sources.append("Live market data (Alpha Vantage / Yahoo Finance)")

    return {
        "answer": answer,
        "sources": sources,
        "route": route
    }