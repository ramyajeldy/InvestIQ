import requests
import json
import os
import time
from datetime import datetime, UTC
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
            # Get current quote
            quote_url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
            r = requests.get(quote_url, timeout=10)
            data = r.json()
            quote = data.get("Global Quote", {})
            if not quote:
                print(f"WARNING: No quote data for {symbol} - {data}")
                results[symbol] = None
                time.sleep(12)
                continue

            current_price = float(quote.get("05. price", 0))
            print(f"OK: {symbol} quote = ${current_price}")
            time.sleep(12)

            # Get historical daily prices
            print(f"Fetching {symbol} history...")
            history_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={ALPHA_VANTAGE_KEY}"
            r2 = requests.get(history_url, timeout=10)
            history_data = r2.json()
            time_series = history_data.get("Time Series (Daily)", {})

            if not time_series:
                print(f"WARNING: No history for {symbol}")
                results[symbol] = None
                time.sleep(12)
                continue

            # Sort dates
            sorted_dates = sorted(time_series.keys(), reverse=True)
            prices = {d: float(time_series[d]["4. close"]) for d in sorted_dates}

            # Calculate changes
            today_price = list(prices.values())[0]

            def get_change(days):
                if len(sorted_dates) > days:
                    past_price = prices[sorted_dates[days]]
                    return round((today_price - past_price) / past_price * 100, 2)
                return None

            # YTD change
            current_year = datetime.now(UTC).year
            ytd_dates = [d for d in sorted_dates if d.startswith(str(current_year))]
            if ytd_dates:
                first_of_year_price = prices[ytd_dates[-1]]
                ytd_change = round((today_price - first_of_year_price) / first_of_year_price * 100, 2)
            else:
                ytd_change = None

            results[symbol] = {
                "symbol": symbol,
                "price": current_price,
                "change_percent": quote.get("10. change percent", "0%"),
                "volume": quote.get("06. volume", "0"),
                "latest_trading_day": quote.get("07. latest trading day", ""),
                "change_7d": get_change(7),
                "change_30d": get_change(30),
                "change_ytd": ytd_change,
                "history": {d: prices[d] for d in sorted_dates[:35]},
                "extracted_at": datetime.now(UTC).isoformat()
            }
            print(f"OK: {symbol} 7d={get_change(7)}% 30d={get_change(30)}% ytd={ytd_change}%")
            time.sleep(12)

        except Exception as e:
            print(f"ERROR: {symbol} failed - {e}")
            results[symbol] = None
            time.sleep(12)

    print("Stock extraction complete.")
    return results

if __name__ == "__main__":
    data = extract_stocks()
    print(json.dumps(data, indent=2))