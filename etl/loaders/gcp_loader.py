import json
import os
from datetime import datetime, UTC
from google.cloud import storage
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = os.getenv("GCP_BUCKET_NAME")

def get_client():
    import json
    project = os.getenv("GCP_PROJECT_ID")
    creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if creds_json:
        from google.oauth2 import service_account
        from google.auth.credentials import AnonymousCredentials
        import google.auth
        
        try:
            creds_data = json.loads(creds_json)
            if creds_data.get("type") == "service_account":
                creds = service_account.Credentials.from_service_account_info(creds_data)
            else:
                from google.oauth2.credentials import Credentials
                creds = Credentials(
                    token=creds_data.get("access_token"),
                    refresh_token=creds_data.get("refresh_token"),
                    token_uri=creds_data.get("token_uri"),
                    client_id=creds_data.get("client_id"),
                    client_secret=creds_data.get("client_secret")
                )
            return storage.Client(project=project, credentials=creds)
        except Exception as e:
            print(f"Credentials error: {e}")
    
    return storage.Client(project=project)

def upload_json(data, blob_path):
    client = get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_path)
    blob.upload_from_string(
        json.dumps(data, indent=2),
        content_type="application/json"
    )
    print(f"Uploaded: gs://{BUCKET_NAME}/{blob_path}")

def upload_text(text, blob_path):
    client = get_client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(blob_path)
    blob.upload_from_string(text, content_type="text/plain")
    print(f"Uploaded: gs://{BUCKET_NAME}/{blob_path}")

def load_bronze(stocks_raw, metals_raw, docs_raw):
    print("Loading Bronze layer...")
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    upload_json(stocks_raw, f"bronze/stocks/{today}.json")
    upload_json(metals_raw, f"bronze/metals/{today}.json")
    for doc in docs_raw:
        safe_name = doc['title'].replace(" ", "_").lower()
        upload_text(doc['text'], f"bronze/documents/{safe_name}.txt")
    print("Bronze layer complete.")

def load_silver(stocks_silver, metals_silver, docs_silver):
    print("Loading Silver layer...")
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    upload_json(stocks_silver, f"silver/stocks/{today}.json")
    upload_json(metals_silver, f"silver/metals/{today}.json")
    upload_json(docs_silver, f"silver/documents/{today}.json")
    print("Silver layer complete.")

def load_gold(stocks_silver, metals_silver):
    print("Loading Gold layer...")
    gold = {
        "assets": {},
        "updated_at": datetime.now(UTC).isoformat()
    }
    for symbol, data in stocks_silver.items():
        gold["assets"][symbol] = data
    for name, data in metals_silver.items():
        gold["assets"][name] = data
    upload_json(gold, "gold/market_snapshot.json")
    print("Gold layer complete.")

def write_pipeline_status(status, source_results):
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    pipeline_status = {
        "run_date": today,
        "status": status,
        "sources": source_results,
        "written_at": datetime.now(UTC).isoformat()
    }
    upload_json(pipeline_status, "pipeline_status.json")
    print(f"Pipeline status: {status}")

if __name__ == "__main__":
    print("GCP Loader module ready")