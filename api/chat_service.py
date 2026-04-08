from api.classifier import classify_question
from api.responder import respond
from api.retriever import retrieve_documents, retrieve_market_data


def process_chat_question(question: str, is_ready: bool) -> dict:
    cleaned_question = question.strip()

    if not cleaned_question:
        return {"answer": "Question cannot be empty", "sources": [], "route": "error"}

    if not is_ready:
        return {
            "answer": "Knowledge base is warming up, please try again in a moment.",
            "sources": [],
            "route": "warming_up",
        }

    classification = classify_question(cleaned_question)
    route = classification["route"]
    assets = classification["assets"]
    window = classification["window"]

    print(f"Question: {cleaned_question}")
    print(f"Route: {route} | Assets: {assets} | Window: {window}")

    chunks = []
    market_data = {}

    if route in ["document", "mixed"]:
        chunks = retrieve_documents(cleaned_question)

    if route in ["market_data", "mixed"]:
        market_data = retrieve_market_data(assets if assets else None)

    return respond(cleaned_question, route, chunks, market_data)
