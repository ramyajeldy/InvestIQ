import requests
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

METALS = {
    "Gold": "GC=F",
    "Silver": "SI=F"
}

def extract_metals():
    print("Starting metals extraction...")
    results = {}
    headers = {"User-Agent": "Mozilla/5.0"}
    for name, symbol in METALS.items():
        print(f"Fetching {name}...")
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            r = requests.get(url, headers=headers, timeout=10)
            data = r.json()
            meta = data["chart"]["result"][0]["meta"]
            price = meta["regularMarketPrice"]
            results[name] = {
                "symbol": symbol,
                "name": name,
                "price": price,
                "currency": meta.get("currency", "USD"),
                "extracted_at": datetime.utcnow().isoformat()
            }
            print(f"OK: {name} = ${price}")
        except Exception as e:
            print(f"ERROR: {name} failed - {e}")
            results[name] = None
    print("Metals extraction complete.")
    return results

if __name__ == "__main__":
    import json
    data = extract_metals()
    print(json.dumps(data, indent=2))