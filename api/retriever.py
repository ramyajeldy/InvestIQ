import chromadb
from google import genai
from api.market_snapshot import filter_snapshot_assets, load_market_snapshot
from api.config import (
    GEMINI_API_KEY, GCP_BUCKET_NAME, GCP_PROJECT_ID,
    CHROMA_PATH, CHROMA_COLLECTION, MAX_RETRIEVAL_RESULTS
)

def get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client.get_collection(CHROMA_COLLECTION)

def embed_query(question: str):
    client = genai.Client(api_key=GEMINI_API_KEY)
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=question
    )
    return result.embeddings[0].values

def retrieve_documents(question: str) -> list:
    print(f"Retrieving documents for: {question}")
    try:
        collection = get_chroma_collection()
        query_embedding = embed_query(question)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=MAX_RETRIEVAL_RESULTS,
            include=["documents", "metadatas", "distances"]
        )
        chunks = []
        for i, doc in enumerate(results["documents"][0]):
            chunks.append({
                "text": doc,
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i]
            })
            print(f"Retrieved: {results['metadatas'][0][i]['title']} (distance: {results['distances'][0][i]:.3f})")
        return chunks
    except Exception as e:
        print(f"Document retrieval error: {e}")
        return []

def retrieve_market_data(assets: list = None) -> dict:
    print(f"Retrieving market data for: {assets}")
    try:
        snapshot = load_market_snapshot()
        return filter_snapshot_assets(snapshot, assets)
    except Exception as e:
        print(f"Market data retrieval error: {e}")
        return {}
