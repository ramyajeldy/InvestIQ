import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.extractors.stocks import extract_stocks
from etl.extractors.metals import extract_metals
from etl.extractors.pdf_extractor import extract_pdfs
from etl.extractors.web_scraper import extract_web
from etl.transformers.transform import transform_stocks, transform_metals, transform_documents
from etl.loaders.gcp_loader import load_bronze, load_silver, load_gold, write_pipeline_status

def run_pipeline():
    print("=" * 50)
    print("InvestIQ ETL Pipeline Starting...")
    print("=" * 50)

    source_results = {}
    all_passed = True

    # EXTRACT
    try:
        stocks_raw = extract_stocks()
        passed = all(v is not None for v in stocks_raw.values())
        source_results["alpha_vantage"] = {
            "status": "ok" if passed else "partial",
            "records": len([v for v in stocks_raw.values() if v])
        }
        if not passed:
            all_passed = False
    except Exception as e:
        print(f"FAILED: stocks - {e}")
        stocks_raw = {}
        source_results["alpha_vantage"] = {"status": "failed", "error": str(e)}
        all_passed = False

    try:
        metals_raw = extract_metals()
        passed = all(v is not None for v in metals_raw.values())
        source_results["yahoo_finance"] = {
            "status": "ok" if passed else "partial",
            "records": len([v for v in metals_raw.values() if v])
        }
        if not passed:
            all_passed = False
    except Exception as e:
        print(f"FAILED: metals - {e}")
        metals_raw = {}
        source_results["yahoo_finance"] = {"status": "failed", "error": str(e)}
        all_passed = False

    try:
        pdfs_raw = extract_pdfs()
        source_results["pdfs"] = {
            "status": "ok" if len(pdfs_raw) == 3 else "partial",
            "records": len(pdfs_raw)
        }
        if len(pdfs_raw) != 3:
            all_passed = False
    except Exception as e:
        print(f"FAILED: pdfs - {e}")
        pdfs_raw = []
        source_results["pdfs"] = {"status": "failed", "error": str(e)}
        all_passed = False

    try:
        web_raw = extract_web()
        source_results["web_scrape"] = {
            "status": "ok" if len(web_raw) == 3 else "partial",
            "records": len(web_raw)
        }
        if len(web_raw) != 3:
            all_passed = False
    except Exception as e:
        print(f"FAILED: web - {e}")
        web_raw = []
        source_results["web_scrape"] = {"status": "failed", "error": str(e)}
        all_passed = False

    # TRANSFORM
    all_docs_raw = pdfs_raw + web_raw
    for doc in web_raw:
        doc["source_type"] = "web"
    for doc in pdfs_raw:
        doc["source_type"] = "pdf"

    stocks_silver = transform_stocks(stocks_raw)
    metals_silver = transform_metals(metals_raw)
    docs_silver = transform_documents(all_docs_raw)

    source_results["chunks_created"] = len(docs_silver)

    # LOAD
    load_bronze(stocks_raw, metals_raw, all_docs_raw)
    load_silver(stocks_silver, metals_silver, docs_silver)
    load_gold(stocks_silver, metals_silver)

# STATUS
    final_status = "SUCCESS" if all_passed else "PARTIAL"
    write_pipeline_status(final_status, source_results)

    # Save local copies for GitHub Actions artifacts
    import json
    os.makedirs("data/gold", exist_ok=True)
    with open("pipeline_status.json", "w") as f:
        json.dump({"status": final_status, "sources": source_results}, f, indent=2)

    print("=" * 50)
    print(f"Pipeline complete: {final_status}")
    print("=" * 50)
    return final_status

if __name__ == "__main__":
    run_pipeline()
