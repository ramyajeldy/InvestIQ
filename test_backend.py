import sys
sys.path.append('.')
from api.classifier import classify_question

tests = [
    "what is market risk?",
    "how does diversification work?",
    "what is an ETF?",
    "what is the weather today?",
    "tell me about bonds",
]

for q in tests:
    result = classify_question(q)
    print(f"Q: {q}")
    print(f"Route: {result['route']} | Confidence: {result['confidence']}")
    print()
    
import requests

questions = [
    "what is market risk?",
    "how does diversification work?",
    "what is an ETF?",
    "what is the weather today?",
]

for q in questions:
    r = requests.post("http://localhost:3001/chat", json={"question": q})
    data = r.json()
    print(f"Q: {q}")
    print(f"Route: {data['route']}")
    print(f"Answer: {data['answer'][:150]}")
    print()