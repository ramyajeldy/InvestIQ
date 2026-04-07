import os
import json
from google.cloud import storage

def get_gcp_client():
    project = os.getenv("GCP_PROJECT_ID")
    creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if creds_json:
        try:
            creds_data = json.loads(creds_json)
            if creds_data.get("type") == "service_account":
                from google.oauth2 import service_account
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

def download_chroma_from_gcp():
    print("Downloading Chroma artifacts from GCP...")
    try:
        client = get_gcp_client()
        bucket = client.bucket(os.getenv("GCP_BUCKET_NAME"))
        blobs = list(bucket.list_blobs(prefix="chroma/"))
        if not blobs:
            print("No Chroma artifacts found in GCP")
            return False
        for blob in blobs:
            local_path = blob.name.replace("chroma/", "", 1)
            if not local_path:
                continue
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            blob.download_to_filename(local_path)
            print(f"Downloaded: {local_path}")
        print("Chroma artifacts downloaded successfully")
        return True
    except Exception as e:
        print(f"Failed to download Chroma artifacts: {e}")
        return False