import requests
import json

r = requests.get("http://localhost:3001/market-snapshot?window=30d")
data = r.json()
for name, asset in data["assets"].items():
    print(f"{name}: price={asset['price']} change={asset['change']}%")