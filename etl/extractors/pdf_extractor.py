import fitz
import os
from datetime import datetime

PDF_DIR = "data/pdfs"

PDFS = [
    {
        "file": "bii-global-outlook-2026.pdf",
        "title": "BlackRock Investment Outlook 2026",
        "source": "BlackRock"
    },
    {
        "file": "Gold Demand Trends_Q4 Full Year_Final.pdf",
        "title": "Gold Demand Trends Q4 2024",
        "source": "World Gold Council"
    },
    {
        "file": "voo- mutual funds.pdf",
        "title": "Vanguard Mutual Funds",
        "source": "Vanguard"
    }
]

def extract_pdfs():
    print("Starting PDF extraction...")
    results = []
    for pdf in PDFS:
        path = os.path.join(PDF_DIR, pdf["file"])
        print(f"Reading {pdf['title']}...")
        try:
            doc = fitz.open(path)
            text = ""
            for page in doc:
                text += page.get_text()
            results.append({
                "title": pdf["title"],
                "source": pdf["source"],
                "file": pdf["file"],
                "pages": len(doc),
                "characters": len(text),
                "text": text,
                "extracted_at": datetime.utcnow().isoformat()
            })
            print(f"OK: {pdf['title']} - {len(doc)} pages, {len(text)} chars")
        except Exception as e:
            print(f"ERROR: {pdf['file']} failed - {e}")
    print("PDF extraction complete.")
    return results

if __name__ == "__main__":
    data = extract_pdfs()
    for d in data:
        print(f"{d['title']}: {d['pages']} pages, {d['characters']} chars")