import json
import sys
from io import BytesIO

import pandas as pd
import requests
from msal import ConfidentialClientApplication

# Static config per request
TENANT_ID = "114c8106-747f-4cc7-870e-8712e6c23b18"
CLIENT_ID = "b357e50c-c5ef-484d-84df-fe470fe76528"
CLIENT_SECRET = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE"
SITE_HOSTNAME = "juggernautenterprises.sharepoint.com"
SITE_PATH = "/sites/TestCloud"
DOC_LIBRARY = "TestClient"
FY_YEAR = "TestClient_FY25"


def get_access_token() -> str:
    app = ConfidentialClientApplication(
        CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        client_credential=CLIENT_SECRET,
    )
    token_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    access_token = token_response.get("access_token")
    if not access_token:
        raise Exception("Failed to acquire access token")
    return access_token


def get_drive_id(headers: dict) -> str:
    site_resp = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{SITE_HOSTNAME}:{SITE_PATH}",
        headers=headers,
        timeout=60,
    )
    site_resp.raise_for_status()
    site_id = site_resp.json()["id"]

    drives_resp = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives",
        headers=headers,
        timeout=60,
    )
    drives_resp.raise_for_status()
    drive_id = next((d["id"] for d in drives_resp.json().get("value", []) if d.get("name") == DOC_LIBRARY), None)
    if not drive_id:
        raise Exception(f"Library '{DOC_LIBRARY}' not found in site '{SITE_PATH}'")
    return drive_id


def load_columns(file_name: str, folder_name: str = "client") -> list[str]:
    # Ensure file has an extension; default to .xlsx
    if "." not in file_name:
        file_name = f"{file_name}.xlsx"

    access_token = get_access_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{FY_YEAR}/{folder_name}/{file_name}:/content"
    resp = requests.get(download_url, headers=headers, timeout=120)
    resp.raise_for_status()

    # Read only headers
    df = pd.read_excel(BytesIO(resp.content), nrows=0)
    # Clean headers: remove extra spaces and newlines
    df.columns = df.columns.str.replace(r"\s+", " ", regex=True)
    return [str(c) for c in df.columns]


def main():
    try:
        cfg = None
        if len(sys.argv) >= 2:
            try:
                with open(sys.argv[1], "r", encoding="utf-8") as f:
                    cfg = json.load(f)
            except Exception as e:
                print(json.dumps({"ok": False, "error": f"Failed to read config: {e}"}))
                sys.exit(1)
        if not cfg:
            print(json.dumps({"ok": False, "error": "Missing config"}))
            sys.exit(1)
        file_name = cfg.get("file_name", "")
        folder_name = cfg.get("folder_name", "client")
        cols = load_columns(file_name, folder_name)
        print(json.dumps({"ok": True, "columns": cols}))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
