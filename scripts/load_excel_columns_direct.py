import requests
from msal import ConfidentialClientApplication
import pandas as pd
from io import BytesIO
import sys
import json

def load_excel_columns_direct(file_name, tenant_id, client_id, client_secret, site_hostname, site_path, doc_library, fy_year, folder_name):
    try:
        # --- 1️⃣ Acquire token ---
        app = ConfidentialClientApplication(
            client_id,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            client_credential=client_secret
        )
        token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
        access_token = token_response.get("access_token")
        if not access_token:
            raise Exception("Failed to acquire access token")
        headers = {"Authorization": f"Bearer {access_token}"}

        # --- 2️⃣ Get site ID ---
        site_url = f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}"
        site_resp = requests.get(site_url, headers=headers)
        site_resp.raise_for_status()
        site_id = site_resp.json()["id"]

        # --- 3️⃣ Get drive ID ---
        drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
        drives_resp.raise_for_status()
        drive_id = next((d["id"] for d in drives_resp.json()["value"] if d["name"] == doc_library), None)
        if not drive_id:
            raise Exception(f"Library '{doc_library}' not found in site '{site_path}'")

        # --- 4️⃣ Stream file into memory ---
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
        resp = requests.get(download_url, headers=headers)
        resp.raise_for_status()

        # --- 5️⃣ Read only first row (headers) ---
        df = pd.read_excel(BytesIO(resp.content), nrows=0)  # nrows=0 = only headers
        output = list(df.columns)
        
        return {"success": True, "columns": output}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    try:
        # The system passes a config file path as the third argument
        if len(sys.argv) >= 3:
            config_path = sys.argv[2]
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Extract parameters from config
            file_name = config.get('file_name', '')
            tenant_id = config.get('tenant_id', '')
            client_id = config.get('client_id', '')
            client_secret = config.get('client_secret', '')
            site_hostname = config.get('site_hostname', '')
            site_path = config.get('site_path', '')
            doc_library = config.get('doc_library', '')
            fy_year = config.get('fy_year', '')
            folder_name = config.get('folder_name', '')
            
            result = load_excel_columns_direct(file_name, tenant_id, client_id, client_secret, site_hostname, site_path, doc_library, fy_year, folder_name)
            print(json.dumps(result))
        else:
            print(json.dumps({"success": False, "error": "No config file provided."}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Script error: {str(e)}"}))
        sys.exit(1)
