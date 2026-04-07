import requests

BASE_URL = "https://investiq-api.onrender.com"

tests = [
    "What questions are supported?",
    "What is the market outlook for 2026?",
    "What is a mutual fund and how does it work?",
    "What is the weather today?",
]

for q in tests:
    r = requests.post(f"{BASE_URL}/chat", json={"question": q}, timeout=60)
    data = r.json()
    print(f"Q: {q[:50]}")
    print(f"Route: {data['route']}")
    print(f"Answer: {data['answer'][:100]}")
    print()