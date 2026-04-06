import os
import json
import chromadb
from google.cloud import storage
from dotenv import load_dotenv
from google import genai

load_dotenv()

BUCKET_NAME = os.getenv("GCP_BUCKET_NAME")
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
CHROMA_PATH = "chroma_db"

def get_silver_documents():
    print("Loading silver documents from GCP...")
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs(prefix="silver/documents/"))
    if not blobs:
        raise Exception("No silver documents found in GCP")
    latest = sorted(blobs, key=lambda b: b.name)[-1]
    content = latest.download_as_text()
    docs = json.loads(content)
    print(f"Loaded {len(docs)} chunks from {latest.name}")
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
    import chromadb
    from chromadb.api.types import EmbeddingFunction

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
            metadatas=[{
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

def upload_chroma_to_gcp():
    print("Uploading Chroma artifacts to GCP...")
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(BUCKET_NAME)
    
    for root, dirs, files in os.walk(CHROMA_PATH):
        for file in files:
            local_path = os.path.join(root, file)
            blob_path = local_path.replace("\\", "/")
            blob = bucket.blob(f"chroma/{blob_path}")
            blob.upload_from_filename(local_path)
            print(f"Uploaded: {blob_path}")
    print("Chroma artifacts uploaded to GCP")

def run_chroma_pipeline():
    docs = get_silver_documents()
    collection = build_chroma_collection(docs)
    upload_chroma_to_gcp()
    return collection

if __name__ == "__main__":
    run_chroma_pipeline()