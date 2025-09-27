#!/usr/bin/env python3
"""
SharePoint ROMM Library Update Script
Updates existing ROMM entries with assessment and documentation
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

    # Get ROMM update values from command line arguments
    if len(sys.argv) < 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: python sharepoint_update_romm.py <romm_id> <assessment> <documentation> [control_ids] [procedure_ids]"
        }))
        sys.exit(1)

    romm_id = sys.argv[1]
    assessment = sys.argv[2]
    documentation = sys.argv[3]
    
    # Parse optional control_ids and procedure_ids
    control_ids = []
    procedure_ids = []
    
    if len(sys.argv) > 4 and sys.argv[4]:
        try:
            control_ids = json.loads(sys.argv[4]) if sys.argv[4] != "[]" else []
        except:
            control_ids = []
    
    if len(sys.argv) > 5 and sys.argv[5]:
        try:
            procedure_ids = json.loads(sys.argv[5]) if sys.argv[5] != "[]" else []
        except:
            procedure_ids = []

    try:
        print("Starting SharePoint update process...", file=sys.stderr)
        print(f"Updating ROMM: {romm_id} with assessment: {assessment}", file=sys.stderr)
        
        # --- 1️⃣ Acquire token ---
        print("Acquiring access token...", file=sys.stderr)
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
        print("Access token acquired successfully", file=sys.stderr)

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

        # --- 5️⃣ Find and update existing entry ---
        entry_found = False
        for entry in data["romm_library"]:
            if entry["romm-id"] == romm_id:
                entry["assesment"] = assessment
                entry["documentation"] = documentation
                
                # Update control_ids and procedure_ids if provided
                if control_ids is not None:
                    entry["control_id"] = control_ids
                if procedure_ids is not None:
                    entry["procedure_id"] = procedure_ids
                
                entry_found = True
                break

        if not entry_found:
            raise Exception(f"ROMM entry with ID '{romm_id}' not found")

        # --- 6️⃣ Upload back (overwrite same file) ---
        upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
        update_resp = requests.put(upload_url, headers=headers, data=json.dumps(data, indent=4).encode("utf-8"))
        update_resp.raise_for_status()

        # Return success response
        print(json.dumps({
            "success": True,
            "message": f"ROMM entry '{romm_id}' updated successfully",
            "data": {
                "romm-id": romm_id,
                "assessment": assessment,
                "documentation": documentation
            }
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
