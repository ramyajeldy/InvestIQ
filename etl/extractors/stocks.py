import requests
import json
import os
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
SYMBOLS = ["SPY", "QQQ", "AAPL"]

def extract_stocks():
    print("Starting stock extraction...")
    results = {}
    for symbol in SYMBOLS:
        print(f"Fetching {symbol}...")
        try:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
            r = requests.get(url, timeout=10)
            data = r.json()
            quote = data.get("Global Quote", {})
            if not quote:
                print(f"WARNING: No data for {symbol} - {data}")
                results[symbol] = None
            else:
                results[symbol] = {
                    "symbol": symbol,
                    "price": float(quote.get("05. price", 0)),
                    "change_percent": quote.get("10. change percent", "0%"),
                    "volume": quote.get("06. volume", "0"),
                    "latest_trading_day": quote.get("07. latest trading day", ""),
                    "extracted_at": datetime.utcnow().isoformat()
                }
                print(f"OK: {symbol} = ${results[symbol]['price']}")
        except Exception as e:
            print(f"ERROR: {symbol} failed - {e}")
            results[symbol] = None
        time.sleep(12)
    print("Stock extraction complete.")
    return results

if __name__ == "__main__":
    data = extract_stocks()
    print(json.dumps(data, indent=2))