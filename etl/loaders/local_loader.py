import json
import os
from datetime import datetime, UTC

DATA_DIR = "data"

def _write_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved: {path}")

def load_bronze(stocks_raw, metals_raw, docs_raw):
    print("Loading Bronze layer (local)...")
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    _write_json(stocks_raw, f"{DATA_DIR}/bronze/stocks/{today}.json")
    _write_json(metals_raw, f"{DATA_DIR}/bronze/metals/{today}.json")
    for doc in docs_raw:
        safe_name = doc["title"].replace(" ", "_").lower()
        os.makedirs(f"{DATA_DIR}/bronze/documents", exist_ok=True)
        with open(f"{DATA_DIR}/bronze/documents/{safe_name}.txt", "w") as f:
            f.write(doc["text"])
    print("Bronze layer complete.")

def load_silver(stocks_silver, metals_silver, docs_silver):
    print("Loading Silver layer (local)...")
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    _write_json(stocks_silver, f"{DATA_DIR}/silver/stocks/{today}.json")
    _write_json(metals_silver, f"{DATA_DIR}/silver/metals/{today}.json")
    _write_json(docs_silver, f"{DATA_DIR}/silver/documents/{today}.json")
    print("Silver layer complete.")

def load_gold(stocks_silver, metals_silver):
    print("Loading Gold layer (local)...")
    gold = {
        "assets": {},
        "updated_at": datetime.now(UTC).isoformat()
    }
    for symbol, data in stocks_silver.items():
        gold["assets"][symbol] = data
    for name, data in metals_silver.items():
        gold["assets"][name] = data
    _write_json(gold, f"{DATA_DIR}/gold/market_snapshot.json")
    print("Gold layer complete.")

def write_pipeline_status(status, source_results):
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    pipeline_status = {
        "run_date": today,
        "status": status,
        "sources": source_results,
        "written_at": datetime.now(UTC).isoformat()
    }
    _write_json(pipeline_status, "pipeline_status.json")
    print(f"Pipeline status: {status}")

if __name__ == "__main__":
    print("Local loader module ready")
