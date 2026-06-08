import os
import json
import chromadb
from dotenv import load_dotenv
from google import genai

load_dotenv()

CHROMA_PATH = "chroma_db"

def get_silver_documents():
    """Load silver documents from local file instead of GCS."""
    print("Loading silver documents from local files...")
    silver_dir = "data/silver/documents"
    if not os.path.exists(silver_dir):
        raise Exception(f"No silver documents found at {silver_dir}")
    files = sorted([f for f in os.listdir(silver_dir) if f.endswith(".json")])
    if not files:
        raise Exception("No silver document JSON files found")
    latest = files[-1]
    with open(os.path.join(silver_dir, latest), "r") as f:
        docs = json.load(f)
    print(f"Loaded {len(docs)} chunks from {latest}")
    return docs

def get_gemini_embeddings(texts, api_key):
    client = genai.Client(api_key=api_key)
    embeddings = []
    for i, text in enumerate(texts):
        result = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text
        )
        embeddings.append(result.embeddings[0].values)
        if (i+1) % 10 == 0:
            print(f"Embedded {i+1}/{len(texts)} chunks...")
    return embeddings

def build_chroma_collection(docs):
    print("Building Chroma collection...")
    api_key = os.getenv("GEMINI_API_KEY")
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        chroma_client.delete_collection("investiq_docs")
        print("Deleted existing collection")
    except:
        pass
    collection = chroma_client.create_collection(
        name="investiq_docs",
        metadata={"hnsw:space": "cosine"}
    )
    print(f"Generating embeddings for {len(docs)} chunks...")
    texts = [d["text"] for d in docs]
    embeddings = get_gemini_embeddings(texts, api_key)
    batch_size = 50
    for i in range(0, len(docs), batch_size):
        batch = docs[i:i+batch_size]
        batch_embeddings = embeddings[i:i+batch_size]
        collection.add(
            ids=[d["chunk_id"] for d in batch],
            documents=[d["text"] for d in batch],
            embeddings=batch_embeddings,
            metadata=[{
                "title": d["title"],
                "source": d["source"],
                "source_type": d.get("source_type", "document"),
                "url_or_file": d.get("url_or_file", ""),
                "chunk_index": d["chunk_index"],
                "total_chunks": d["total_chunks"]
            } for d in batch]
        )
        print(f"Added batch {i//batch_size + 1}")
    count = collection.count()
    print(f"Chroma collection ready: {count} chunks indexed")
    return collection

def run_chroma_pipeline():
    docs = get_silver_documents()
    collection = build_chroma_collection(docs)
    return collection

if __name__ == "__main__":
    run_chroma_pipeline()
