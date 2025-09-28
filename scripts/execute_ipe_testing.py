import json
import os
import requests
from msal import ConfidentialClientApplication
import sys

# === CONFIG ===
TENANT_ID = "114c8106-747f-4cc7-870e-8712e6c23b18"
CLIENT_ID = "b357e50c-c5ef-484d-84df-fe470fe76528"
CLIENT_SECRET = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE"
SITE_HOSTNAME = "juggernautenterprises.sharepoint.com"
SITE_PATH = "/sites/TestCloud"
DOC_LIBRARY = "TestClient"

# Multiple folder target inside the same library
TARGET = "TestClient_FY25/juggernaut"

COLUMN_MAP_FILE = "Execution_Payroll_PRColumnMap.json"
DB_FILE = "db.json"


# --- Graph API token ---
def get_access_token():
    app = ConfidentialClientApplication(
        CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        client_credential=CLIENT_SECRET
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    access_token = token_response.get("access_token")
    if not access_token:
        raise Exception("Failed to acquire access token")
    return access_token


def _get_drive_headers_and_id():
    access_token = get_access_token()
    headers = {"Authorization": f"Bearer {access_token}"}

    # Get site ID
    site_resp = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{SITE_HOSTNAME}:{SITE_PATH}",
        headers=headers
    )
    site_resp.raise_for_status()
    site_id = site_resp.json()["id"]

    # Get drive ID for the document library
    drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
    drives_resp.raise_for_status()
    drive_id = next((d["id"] for d in drives_resp.json().get("value", []) if d.get("name") == DOC_LIBRARY), None)
    if not drive_id:
        raise Exception(f"Library '{DOC_LIBRARY}' not found on site {SITE_PATH}")

    return headers, drive_id


def _build_item_path(folder, file_name):
    if folder:
        return f"{folder}/{file_name}"
    return file_name


def download_json(folder, file_name):
    headers, drive_id = _get_drive_headers_and_id()
    item_path = _build_item_path(folder, file_name)
    content_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{item_path}:/content"

    resp = requests.get(content_url, headers=headers)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


def upload_json(folder, file_name, data):
    headers, drive_id = _get_drive_headers_and_id()
    upload_headers = {
        "Authorization": headers["Authorization"],
        "Content-Type": "application/json"
    }
    item_path = _build_item_path(folder, file_name)
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{item_path}:/content"
    resp = requests.put(upload_url, headers=upload_headers, data=json.dumps(data, indent=4).encode("utf-8"))
    resp.raise_for_status()
    print(f"✅ Uploaded/Updated JSON: {DOC_LIBRARY}/{item_path}")


def update_db(folder, reference_value, file_url):
    db_data = download_json(folder, DB_FILE)
    if db_data is None:
        db_data = {"juggernaut": [], "client": [], "tools": [], "rbin": []}

    new_entry = {"name": COLUMN_MAP_FILE, "url": file_url, "reference": reference_value}
    db_data["juggernaut"].append(new_entry)

    upload_json(folder, DB_FILE, db_data)
    print(f"✅ db.json updated successfully in {DOC_LIBRARY}/{folder or '[root]'}!")


def update_columnmap(folder, custom_keys: list):
    field_names = [
        'employee_code','employee_name','designation','pay_month',
        'date_of_joining','date_of_leaving','pan','gross_pay',
        'net_pay','total_deductions','pf','esi'
    ]
    if len(custom_keys) != len(field_names):
        raise ValueError("`custom_keys` and `field_names` must have the same length!")

    column_map = dict(zip(field_names, custom_keys))

    data = download_json(folder, COLUMN_MAP_FILE)
    if data is None:
        data = {"column_map": column_map}
        print(f"ℹ️ Creating new JSON with only `column_map` in {DOC_LIBRARY}/{folder or '[root]' }.") 
    else:
        data["column_map"] = column_map
        print(f"ℹ️ Existing JSON found — updated `column_map` in {DOC_LIBRARY}/{folder or '[root]' }.")

    upload_json(folder, COLUMN_MAP_FILE, data)
    return f"https://{SITE_HOSTNAME}/sites{SITE_PATH}/{DOC_LIBRARY}/{folder}/{COLUMN_MAP_FILE}"


def jugg(folder, reference_value, custom_keys: list):
    file_url = update_columnmap(folder, custom_keys)
    update_db(folder, reference_value, file_url)


if __name__ == "__main__":
    try:
        # The system passes a config file path as the third argument
        if len(sys.argv) >= 3:
            config_path = sys.argv[2]
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Extract parameters from config
            ipe_custom_keys = config.get('ipe_custom_keys', [])
            reference_value = config.get('reference_value', '')
            
            print(f"Running IPE Testing with custom keys: {ipe_custom_keys}")
            print(f"Reference value: {reference_value}")
            
            # Run the jugg function
            jugg(TARGET, reference_value, ipe_custom_keys)
            
            result = {"success": True, "message": "IPE Testing completed successfully"}
            print(json.dumps(result))
        else:
            result = {"success": False, "error": "No config file provided."}
            print(json.dumps(result))
            sys.exit(1)
    except Exception as e:
        result = {"success": False, "error": f"Script error: {str(e)}"}
        print(json.dumps(result))
        sys.exit(1)
