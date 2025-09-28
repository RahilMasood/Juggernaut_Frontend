import requests
from msal import ConfidentialClientApplication
import pandas as pd
from io import BytesIO
import json
import sys

def main():
    # Get parameters from command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing parameters"}))
        return
    
    # Parse parameters from JSON
    try:
        params = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON parameters"}))
        return
    
    # Extract parameters
    file_name = params.get('file_name', '')
    tenant_id = params.get('tenant_id', '')
    client_id = params.get('client_id', '')
    client_secret = params.get('client_secret', '')
    site_hostname = params.get('site_hostname', '')
    site_path = params.get('site_path', '')
    doc_library = params.get('doc_library', '')
    fy_year = params.get('fy_year', '')
    folder_name = params.get('folder_name', '')
    
    if not file_name:
        print(json.dumps({"error": "file_name is required"}))
        return
    
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
        
        # Return the columns as JSON
        columns = list(df.columns)
        result = {
            "success": True,
            "columns": columns
        }
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
