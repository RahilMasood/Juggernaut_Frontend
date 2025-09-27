#!/usr/bin/env python3
"""
SharePoint ROMM Library Reader Script
Reads ROMM data from SharePoint and returns it as JSON
"""

import requests
import json
import sys
from msal import ConfidentialClientApplication

def main():
    # --- Config ---
    tenant_id = "114c8106-747f-4cc7-870e-8712e6c23b18"
    client_id = "b357e50c-c5ef-484d-84df-fe470fe76528"
    client_secret = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE"

    site_hostname = "juggernautenterprises.sharepoint.com"
    site_path = "/sites/TestCloud"
    doc_library = "TestClient"
    fy_year = "TestClient_FY25"
    folder_name = "juggernaut"
    file_name = "Libraries_Romm.json"

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

        # --- 2️⃣ Get site ID directly with hostname + path ---
        site_url = f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}"
        site_resp = requests.get(site_url, headers=headers)
        site_resp.raise_for_status()
        site_id = site_resp.json()["id"]

        # --- 3️⃣ Get drive ID once ---
        drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
        drives_resp.raise_for_status()
        drive_id = next((d["id"] for d in drives_resp.json()["value"] if d["name"] == doc_library), None)
        if not drive_id:
            raise Exception(f"Library '{doc_library}' not found in site '{site_path}'")

        # --- 4️⃣ Download file from SharePoint ---
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
        resp = requests.get(download_url, headers=headers)
        resp.raise_for_status()
        data = resp.json()  # directly parse JSON

        # Return success response with data
        print(json.dumps({
            "success": True,
            "message": "ROMM library data retrieved successfully",
            "data": data
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
