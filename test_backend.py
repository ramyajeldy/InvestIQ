import requests

tests = [
    "What questions are supported?",
    "What is a mutual fund and how does it work?",
    "What is the market outlook for 2026?",
    "Is gold a good hedge against inflation?",
    "What are low-risk investment options?",
    "How does Gold compare to SPY over 30 days?",
    "What is the weather today?",
]

for q in tests:
    r = requests.post("http://localhost:3001/chat", json={"question": q})
    data = r.json()
    print(f"Q: {q[:50]}")
    print(f"Route: {data['route']}")
    print(f"Answer: {data['answer'][:100]}")
    print()