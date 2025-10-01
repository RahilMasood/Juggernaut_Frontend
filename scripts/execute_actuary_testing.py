import requests
from msal import ConfidentialClientApplication
import pandas as pd
import json
from io import BytesIO
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
    site_resp = requests.get(site_url, headers=headers, timeout=60)
    site_resp.raise_for_status()
    site_id = site_resp.json()["id"]

    drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers, timeout=60)
    drives_resp.raise_for_status()
    for d in drives_resp.json()["value"]:
        if d["name"] == doc_library:
            return d["id"]
    raise Exception(f"Library '{doc_library}' not found")

def download_file(headers, drive_id, file_name, folder_name):
    download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
    resp = requests.get(download_url, headers=headers, timeout=120)
    resp.raise_for_status()
    return resp.content

def upload_file(headers, drive_id, file_bytes, remote_name, folder_name):
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{remote_name}:/content"
    resp = requests.put(upload_url, headers=headers, data=file_bytes.getvalue(), timeout=120)
    resp.raise_for_status()
    return resp.json().get("webUrl")

# === MAIN RECON FUNCTION ===
def run_actuary_recon(ctc_content, actuary_content, input_mapping):
    df_at = pd.read_excel(BytesIO(actuary_content))
    df_ctc = pd.read_excel(BytesIO(ctc_content))

    # Clean column names
    df_at.columns = df_at.columns.str.strip().str.replace('\n', '')
    df_ctc.columns = df_ctc.columns.str.strip().str.replace('\n', '')

    # --- ROW COUNTS ---
    row_ctc = len(df_ctc.dropna(how="all"))
    row_at = len(df_at.dropna(how="all"))
    diff = row_at - row_ctc
    usr_rows = 0
    net_diff = diff - usr_rows

    # --- USE COLUMN MAPPINGS DIRECTLY ---
    # Validate mapping structure
    if not isinstance(input_mapping, dict) or "column_map" not in input_mapping:
        raise ValueError("input_mapping must be of shape { 'column_map': [ { 'CTC': 'Col', 'Actuary': 'Col' }, ... ] }")
    mapping_data = input_mapping["column_map"]
    if not isinstance(mapping_data, list) or len(mapping_data) < 1:
        raise ValueError("column_map must be a non-empty list")
    for i, m in enumerate(mapping_data):
        if not isinstance(m, dict) or "CTC" not in m or "Actuary" not in m:
            raise ValueError(f"column_map[{i}] must be an object like {{'CTC': '...', 'Actuary': '...'}}")
    ctc_id_col = str(mapping_data[0]["CTC"]).strip()
    actuary_id_col = str(mapping_data[0]["Actuary"]).strip()

    # Validate columns exist
    if ctc_id_col not in df_ctc.columns:
        raise KeyError(f"CTC column not found: {ctc_id_col}")
    if actuary_id_col not in df_at.columns:
        raise KeyError(f"Actuary column not found: {actuary_id_col}")

    # --- FIND COMMON IDs ---
    common_ids = set(df_ctc[ctc_id_col]).intersection(set(df_at[actuary_id_col]))
    df_ctc_common = df_ctc[df_ctc[ctc_id_col].isin(common_ids)].copy()
    df_at_common = df_at[df_at[actuary_id_col].isin(common_ids)].copy()

    # Sort and align
    df_ctc_common.sort_values(by=ctc_id_col, inplace=True)
    df_at_common.sort_values(by=actuary_id_col, inplace=True)
    df_ctc_common.reset_index(drop=True, inplace=True)
    df_at_common.reset_index(drop=True, inplace=True)

    # Format datetime columns
    for df in [df_ctc_common, df_at_common]:
      for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
          df[col] = df[col].dt.strftime("%d-%b-%Y")

    # Helper: Excel col letters
    def excel_col_letter(idx):
        letters = ""
        while idx >= 0:
            letters = chr(idx % 26 + 65) + letters
            idx = idx // 26 - 1
        return letters

    # === BUILD FINAL OUTPUT EXCEL ===
    final_df = pd.DataFrame()

    # 1. Add CTC cols
    for mapping in mapping_data:
        col_ctc = str(mapping["CTC"]).strip()
        if col_ctc not in df_ctc_common.columns:
            raise KeyError(f"CTC column not found: {col_ctc}")
        final_df[f"{col_ctc} (CTC)"] = df_ctc_common[col_ctc].values

    final_df[""] = ""  # blank

    # 2. Add Actuary cols
    for mapping in mapping_data:
        col_at = str(mapping["Actuary"]).strip()
        if col_at not in df_at_common.columns:
            raise KeyError(f"Actuary column not found: {col_at}")
        final_df[f"{col_at} (Actuary)"] = df_at_common[col_at].values

    final_df[" "] = ""  # blank

    # 3. Add Diff cols
    for mapping in mapping_data[1:]:
        ctc_name = f"{mapping['CTC'].strip()} (CTC)"
        at_name = f"{mapping['Actuary'].strip()} (Actuary)"
        ctc_letter = excel_col_letter(final_df.columns.get_loc(ctc_name))
        at_letter = excel_col_letter(final_df.columns.get_loc(at_name))
        diff_name = f"Diff {mapping['CTC'].strip()}"
        final_df[diff_name] = [f"={ctc_letter}{i+2} - {at_letter}{i+2}" for i in range(len(final_df))]

    # --- Prepare in-memory Excel + JSON ---
    excel_buffer = BytesIO()
    final_df.to_excel(excel_buffer, index=False)
    excel_buffer.seek(0)

    output_data = {
        "Actuary_rows": row_at,
        "CTC_Report_rows": row_ctc,
        "Difference": diff,
        "User_Rows": usr_rows,
        "Net_Difference": net_diff
    }
    json_buffer = BytesIO(json.dumps(output_data, indent=4).encode("utf-8"))

    return excel_buffer, json_buffer

# === MASTER FUNCTION ===
def jugg(actuary_file, ctc_file, input_mapping):
    access_token = get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    # Download input files from client folder
    actuary_content = download_file(headers, drive_id, actuary_file, "client")
    ctc_content = download_file(headers, drive_id, ctc_file, "client")

    # Run reconciliation
    excel_buffer, json_buffer = run_actuary_recon(ctc_content, actuary_content, input_mapping)

    # Upload outputs
    excel_url = upload_file(headers, drive_id, excel_buffer, "Execution_Payroll_ActuaryTesting.xlsx", "client")
    json_url  = upload_file(headers, drive_id, json_buffer, "Execution_Payroll_ActuaryTesting.json", "juggernaut")

    # Update db.json
    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers, timeout=60)
    db_data = db_resp.json() if db_resp.status_code == 200 else {"juggernaut": [], "client": [], "tools": [], "rbin": []}

    db_data["client"].append({"name": "Execution_Payroll_ActuaryTesting.xlsx", "url": excel_url, "reference": "Execution Payroll Actuary vs CTC"})
    db_data["juggernaut"].append({"name": "Execution_Payroll_ActuaryTesting.json", "url": json_url, "reference": ""})

    requests.put(db_url, headers=headers, data=json.dumps(db_data, indent=4).encode("utf-8"), timeout=60)

    return excel_url, json_url


def main():
    # Primary: Electron runner passes key and a config file path
    # argv pattern: [script_path, 'execute_actuary_testing', '.../runs/<id>_config.json']
    payload = None
    if len(sys.argv) >= 3:
        cfg_path = sys.argv[2]
        try:
            with open(cfg_path, 'r', encoding='utf-8') as f:
                payload = json.load(f)
        except Exception:
            payload = None

    # Fallback: argv[1] as inline JSON
    if not isinstance(payload, dict) and len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
        except Exception:
            payload = None

    if not isinstance(payload, dict):
        print(json.dumps({"success": False, "error": "Missing input payload"}))
        sys.exit(1)

    try:
        # Support config objects of shape { options: {...}, output_directory: "..." }
        if isinstance(payload, dict) and "options" in payload and isinstance(payload["options"], dict):
            payload = payload["options"]

        # Normalize file names: strip trailing reference e.g., "File.xlsx (ref)"
        def clean_name(name: str) -> str:
            try:
                return name.split(" (")[0].strip()
            except Exception:
                return name

        ctc_file = payload.get("ctc_file")
        actuary_file = payload.get("actuary_file")
        input_mapping = payload.get("input_mapping")

        if not ctc_file or not actuary_file or not input_mapping:
            print(json.dumps({"success": False, "error": "Missing required inputs"}))
            sys.exit(1)

        excel_url, json_url = jugg(clean_name(actuary_file), clean_name(ctc_file), input_mapping)

        print(json.dumps({"success": True, "excel_url": excel_url, "json_url": json_url}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()


