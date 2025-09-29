import requests
from msal import ConfidentialClientApplication
import json

# --- Config ---
tenant_id = "114c8106-747f-4cc7-870e-8712e6c23b18"
client_id = "b357e50c-c5ef-484d-84df-fe470fe76528"
client_secret = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE"

site_hostname = "juggernautenterprises.sharepoint.com"
site_path = "/sites/TestCloud"
doc_library = "TestClient"
fy_year =  "TestClient_FY25"
folder_name = "juggernaut"
file_name = "Execution_Payroll_HeadcountReconcilation.json"

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

# --- 2️⃣ Get site ID directly with hostname + path ---
site_url = f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}"
site_resp = requests.get(site_url, headers=headers)
site_resp.raise_for_status()
site_id = site_resp.json()["id"]

# --- 3️⃣ Get drive ID once ---
drives_url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives"
drives_resp = requests.get(drives_url, headers=headers)
drives_resp.raise_for_status()
drives_json = drives_resp.json()
drive_id = None
for d in drives_json.get("value", []):
    if d.get("name") == doc_library:
        drive_id = d.get("id")
        break
if not drive_id:
    raise Exception(f"Library '{doc_library}' not found in site '{site_path}'")

# --- 4️⃣ Download file content ---
download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
resp = requests.get(download_url, headers=headers)
resp.raise_for_status()

# The file is JSON. Emit it to stdout so the frontend can parse.
try:
    data = resp.json()
except ValueError:
    data = {"error": "Unexpected content type", "raw": resp.text}

print(json.dumps(data))


