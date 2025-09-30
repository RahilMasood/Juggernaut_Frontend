import sys
import json
import requests
from msal import ConfidentialClientApplication
import pandas as pd
from io import BytesIO


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
        client_credential=client_secret,
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
    data = resp.json()
    return data.get("webUrl")


def run_increment_analysis(existing_excel_bytes, cy_content, py_content, incr_columns, cols_to_sum, reconcile_input):
    # Import here to avoid heavy import unless needed
    from openpyxl import load_workbook  # noqa: F401  # retained per user's code
    from io import BytesIO

    empno_col, name_col, doj_col, designation_col = incr_columns

    cy_df = pd.read_excel(BytesIO(cy_content))
    py_df = pd.read_excel(BytesIO(py_content))

    # Normalize column names
    cy_df.columns = cy_df.columns.str.strip()
    py_df.columns = py_df.columns.str.strip()

    # Merge
    merged_df = pd.merge(
        cy_df,
        py_df,
        left_on=empno_col,
        right_on=empno_col,
        suffixes=("_CY", "_PY"),
    )

    # Calculations
    merged_df["As per CY"] = merged_df[[col + "_CY" for col in cols_to_sum]].sum(axis=1)
    merged_df["As per PY"] = merged_df[[col + "_PY" for col in cols_to_sum]].sum(axis=1)
    merged_df["Increment"] = merged_df["As per CY"] - merged_df["As per PY"]

    merged_df["Increment % Num"] = merged_df.apply(
        lambda x: (x["Increment"] / x["As per PY"]) if x["As per PY"] != 0 else 0, axis=1
    )

    average_increment = merged_df["Increment % Num"].mean()
    merged_df["Increment %"] = merged_df["Increment % Num"].apply(lambda v: round(v, 2))

    # Final dataframe
    final_df = merged_df[
        [
            empno_col,
            name_col + "_CY",
            doj_col + "_CY",
            designation_col + "_CY",
            "As per CY",
            "As per PY",
            "Increment",
            "Increment %",
        ]
    ].copy()

    final_df.rename(
        columns={
            empno_col: "Employee Code",
            name_col + "_CY": "Employee Name",
            doj_col + "_CY": "DOJ",
            designation_col + "_CY": "Designation",
        },
        inplace=True,
    )

    final_df["DOJ"] = pd.to_datetime(final_df["DOJ"]).dt.strftime("%d-%m-%Y")

    # Append new sheet to existing Excel (in-memory)
    excel_buffer = BytesIO(existing_excel_bytes)
    with pd.ExcelWriter(excel_buffer, engine="openpyxl", mode="a") as writer:
        final_df.to_excel(writer, sheet_name="Increment Analysis", index=False, startrow=3)

    excel_buffer.seek(0)

    # JSON summary in memory
    total_before = len(cy_df)
    total_after = len(merged_df)
    particulars = {
        "As per Increment analysis": total_after,
        "As per CTC Report": total_before,
        "User reconciliations": reconcile_input,
        "Difference": total_after - total_before,
        "Average Increment %": round(average_increment * 100, 2),
        "Net Difference": (total_after - total_before) - reconcile_input,
    }

    json_bytes = BytesIO(json.dumps(particulars, indent=4).encode("utf-8"))
    return excel_buffer, json_bytes


def jugg(cy_file, py_file, incr_columns, cols_to_sum, reconcile_input):
    access_token = get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    # Download files from client folder
    cy_content = download_file(headers, drive_id, cy_file, "client")
    py_content = download_file(headers, drive_id, py_file, "client")

    # Download existing Excel from SharePoint
    existing_excel_bytes = download_file(headers, drive_id, "Execution_Payroll_MomIncrement.xlsx", "client")

    # Run analysis -> append new sheet to existing Excel
    excel_buffer, json_buffer = run_increment_analysis(
        existing_excel_bytes, cy_content, py_content, incr_columns, cols_to_sum, reconcile_input
    )

    # Upload updated Excel back to SharePoint
    excel_url = upload_file(headers, drive_id, excel_buffer, "Execution_Payroll_MomIncrement.xlsx", "client")
    json_url = upload_file(headers, drive_id, json_buffer, "Execution_Payroll_IncrementAnalysis.json", "juggernaut")

    # Update db.json
    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers)
    db_data = db_resp.json() if db_resp.status_code == 200 else {"juggernaut": [], "client": [], "tools": [], "rbin": []}

    db_data["client"].append({
        "name": "Execution_Payroll_MomIncrement.xlsx",
        "url": excel_url,
        "reference": "Execution Payroll Increment Analysis",
    })
    db_data["client"].append({
        "juggernaut": "Execution_Payroll_IncrementAnalysis.json",
        "url": json_url,
        "reference": "",
    })

    db_upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    requests.put(db_upload_url, headers=headers, data=json.dumps(db_data, indent=4).encode("utf-8"))

    return {"excel_url": excel_url, "json_url": json_url}


def main():
    try:
        raw = sys.stdin.read() if not sys.stdin.closed else ""
        opts = json.loads(raw) if raw.strip() else {}

        cy_file = opts.get("cy_file")
        py_file = opts.get("py_file")
        incr_columns = opts.get("incr_columns") or []
        cols_to_sum = opts.get("cols_to_sum") or []
        reconcile_input = opts.get("reconcile_input", 0)

        if not isinstance(incr_columns, list) or len(incr_columns) != 4:
            raise Exception("incr_columns must be a list of exactly 4 column names")
        if not isinstance(cols_to_sum, list) or len(cols_to_sum) == 0:
            raise Exception("cols_to_sum must be a non-empty list of column names to sum")
        if not cy_file or not py_file:
            raise Exception("Both cy_file and py_file are required")
        try:
            reconcile_input = int(reconcile_input)
        except Exception:
            raise Exception("reconcile_input must be an integer")

        result = jugg(cy_file, py_file, incr_columns, cols_to_sum, reconcile_input)
        print(json.dumps({"success": True, **result}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))


if __name__ == "__main__":
    main()


