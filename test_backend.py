import requests
import time

start = time.time()
r = requests.post(
    "http://localhost:3001/chat",
    json={"question": "what is the difference between stocks and bonds"},
    timeout=120
)
end = time.time()
print(f"Time taken: {end-start:.1f} seconds")
print(f"Status: {r.status_code}")
data = r.json()
print(f"Route: {data['route']}")
print(f"Answer: {data['answer']}")