import requests
from msal import ConfidentialClientApplication
import pandas as pd
import json
from io import BytesIO
from datetime import datetime
import sys

# === CONFIG ===
tenant_id = "114c8106-747f-4cc7-870e-8712e6c23b18"
client_id = "b357e50c-c5ef-484d-84df-fe470fe76528"
client_secret = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE"

site_hostname = "juggernautenterprises.sharepoint.com"
site_path = "/sites/TestCloud"
doc_library = "TestClient"
fy_year = "TestClient_FY25"


# === AUTH ===
def get_token():
    app = ConfidentialClientApplication(
        client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
        client_credential=client_secret
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if "access_token" not in token_response:
        raise Exception("Failed to acquire access token")
    return token_response["access_token"]


def get_drive_id(headers):
    site_url = f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}"
    site_resp = requests.get(site_url, headers=headers)
    site_resp.raise_for_status()
    site_id = site_resp.json()["id"]

    drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
    drives_resp.raise_for_status()
    for d in drives_resp.json()["value"]:
        if d["name"] == doc_library:
            return d["id"]
    raise Exception(f"Library '{doc_library}' not found")


def download_file(headers, drive_id, file_name, folder_name):
    download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
    resp = requests.get(download_url, headers=headers)
    resp.raise_for_status()
    return resp.content


def upload_file(headers, drive_id, file_bytes, remote_name, folder_name):
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{remote_name}:/content"
    resp = requests.put(upload_url, headers=headers, data=file_bytes.getvalue())
    resp.raise_for_status()
    return resp.json().get("webUrl")


# === BUSINESS LOGIC ===
def run_add_del_analysis(add_content, del_content, col_add, col_del):
    # Get current year
    current_year = datetime.now().year
    start_date = datetime(current_year, 3, 16)
    end_date = datetime(current_year, 3, 31)

    def process_file(file_bytes, col_date, col_amount):
        df = pd.read_excel(BytesIO(file_bytes))
        df.columns = df.columns.str.strip().str.replace('\n', '')

        # Convert date column to datetime
        df[col_date] = pd.to_datetime(df[col_date], errors="coerce")

        # Filter valid rows
        df = df.dropna(subset=[col_date, col_amount])

        # Totals
        total = df[col_amount].sum()

        # Filter last 15 days
        mask = (df[col_date] >= start_date) & (df[col_date] <= end_date)
        last_15_days = df.loc[mask, col_amount].sum()

        # Percentage
        percentage = (last_15_days / total * 100) if total != 0 else 0

        return {
            "Total": round(total, 2),
            "In the last 15 days": round(last_15_days, 2),
            "Percentage in last 15 days": f"{percentage:.2f}%"
        }

    additions_result = process_file(add_content, col_add[0], col_add[1])
    deletions_result = process_file(del_content, col_del[0], col_del[1])

    result = {
        "Additions": additions_result,
        "Deletions": deletions_result
    }

    # Return as BytesIO JSON
    json_buffer = BytesIO(json.dumps(result, indent=4).encode("utf-8"))
    return json_buffer


# === MAIN ===
def jugg(file_additions, file_deletions, col_add, col_del):
    access_token = get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    # Download input files from SharePoint
    add_content = download_file(headers, drive_id, file_additions, "client")
    del_content = download_file(headers, drive_id, file_deletions, "client")

    # Run business logic
    json_buffer = run_add_del_analysis(add_content, del_content, col_add, col_del)

    # Upload JSON back
    json_url = upload_file(headers, drive_id, json_buffer, "Execution_IntAss_ADL.json", "juggernaut")

    # Update db.json
    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers)
    db_data = db_resp.json() if db_resp.status_code == 200 else {"juggernaut": [], "client": [], "tools": [], "rbin": []}

    db_data["juggernaut"].append({
        "name": "Execution_IntAss_ADL.json",
        "url": json_url,
        "reference": "Execution Int Ass ADL"
    })

    requests.put(db_url, headers=headers, data=json.dumps(db_data, indent=4).encode("utf-8"))

    print(json.dumps({"success": True, "json_url": json_url}))


if __name__ == "__main__":
    try:
        if len(sys.argv) >= 3:
            config_path = sys.argv[2]
            with open(config_path, 'r') as f:
                config = json.load(f)
            file_additions = config.get('file_additions')
            file_deletions = config.get('file_deletions')
            col_add = config.get('col_add', [])
            col_del = config.get('col_del', [])
            jugg(file_additions, file_deletions, col_add, col_del)
        else:
            print(json.dumps({"success": False, "error": "No config file provided"}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)




