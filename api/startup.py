def get_gcp_client():
    import json
    import os
    project = os.getenv("GCP_PROJECT_ID")
    creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    
    if creds_json:
        try:
            creds_data = json.loads(creds_json)
            cred_type = creds_data.get("type", "")
            print(f"Credential type: {cred_type}")
            
            if cred_type == "service_account":
                from google.oauth2 import service_account
                creds = service_account.Credentials.from_service_account_info(
                    creds_data,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"]
                )
            elif cred_type == "authorized_user":
                from google.oauth2.credentials import Credentials
                creds = Credentials(
                    token=None,
                    refresh_token=creds_data.get("refresh_token"),
                    token_uri=creds_data.get("token_uri", "https://oauth2.googleapis.com/token"),
                    client_id=creds_data.get("client_id"),
                    client_secret=creds_data.get("client_secret")
                )
            else:
                print(f"Unknown credential type: {cred_type}, using default")
                return storage.Client(project=project)
                
            return storage.Client(project=project, credentials=creds)
        except Exception as e:
            print(f"Credentials error: {e}")
    
    return storage.Client(project=project)