import json
import re
from datetime import datetime, UTC

def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    return text.strip()

def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def transform_stocks(raw_stocks):
    print("Transforming stocks...")
    silver = {}
    for symbol, data in raw_stocks.items():
        if data is None:
            continue
        silver[symbol] = {
            "symbol": symbol,
            "price": data["price"],
            "change_percent": data["change_percent"].replace("%", "").strip(),
            "volume": int(data["volume"]),
            "latest_trading_day": data["latest_trading_day"],
            "asset_type": "stock",
            "transformed_at": datetime.now(UTC).isoformat()
        }
        print(f"OK: {symbol} transformed")
    return silver

def transform_metals(raw_metals):
    print("Transforming metals...")
    silver = {}
    for name, data in raw_metals.items():
        if data is None:
            continue
        silver[name] = {
            "symbol": data["symbol"],
            "name": name,
            "price": data["price"],
            "currency": data["currency"],
            "asset_type": "metal",
            "note": "Futures price - may differ from spot price",
            "transformed_at": datetime.now(UTC).isoformat()
        }
        print(f"OK: {name} transformed")
    return silver

def transform_documents(raw_docs):
    print("Transforming documents...")
    silver = []
    for doc in raw_docs:
        cleaned = clean_text(doc["text"])
        chunks = chunk_text(cleaned)
        for i, chunk in enumerate(chunks):
            silver.append({
                "chunk_id": f"{doc['title'].replace(' ', '_')}_{i}",
                "title": doc["title"],
                "source": doc["source"],
                "source_type": doc.get("source_type", "document"),
                "url_or_file": doc.get("url", doc.get("file", "")),
                "chunk_index": i,
                "total_chunks": len(chunks),
                "text": chunk,
                "transformed_at": datetime.now(UTC).isoformat()
            })
        print(f"OK: {doc['title']} → {len(chunks)} chunks")
    return silver

if __name__ == "__main__":
    print("Transformer module ready")