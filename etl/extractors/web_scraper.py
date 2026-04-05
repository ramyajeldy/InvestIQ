import requests
from bs4 import BeautifulSoup
from datetime import datetime

SOURCES = [
    {
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks",
        "title": "Introduction to Stocks",
        "source": "investor.gov"
    },
    {
        "url": "https://en.wikipedia.org/wiki/Gold_as_an_investment",
        "title": "Gold as an Investment",
        "source": "Wikipedia"
    },
    {
        "url": "https://en.wikipedia.org/wiki/Mutual_fund",
        "title": "Mutual Fund",
        "source": "Wikipedia"
    }
]

def extract_web():
    print("Starting web extraction...")
    results = []
    headers = {"User-Agent": "Mozilla/5.0"}
    for source in SOURCES:
        print(f"Scraping {source['title']}...")
        try:
            r = requests.get(source["url"], headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator=" ", strip=True)
            if len(text) < 1000:
                print(f"WARNING: {source['title']} too short ({len(text)} chars)")
                continue
            results.append({
                "title": source["title"],
                "source": source["source"],
                "url": source["url"],
                "characters": len(text),
                "text": text,
                "extracted_at": datetime.utcnow().isoformat()
            })
            print(f"OK: {source['title']} - {len(text)} chars")
        except Exception as e:
            print(f"ERROR: {source['title']} failed - {e}")
    print("Web extraction complete.")
    return results

if __name__ == "__main__":
    data = extract_web()
    for d in data:
        print(f"{d['title']}: {d['characters']} chars")