import requests
from msal import ConfidentialClientApplication
import pandas as pd
import json
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
    drives = drives_resp.json()["value"]

    for d in drives:
        if d["name"] == doc_library:
            return d["id"]
    raise Exception(f"Library '{doc_library}' not found")


def download_file(headers, drive_id, file_name, folder_name):
    download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
    resp = requests.get(download_url, headers=headers)
    resp.raise_for_status()
    return resp.content


def upload_file(headers, drive_id, local_path, remote_name, folder_name):
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{remote_name}:/content"
    with open(local_path, "rb") as f:
        data = f.read()
    resp = requests.put(upload_url, headers=headers, data=data)
    resp.raise_for_status()
    return resp.json().get("webUrl")


# === HEADCOUNT RECONCILIATION ===
def run_headcount_reco(add_content, del_content, ctc_content, pay_content,
                       opening_apr, dojal, doldl, output_path):

    # Load files into DataFrames
    df_add = pd.read_excel(BytesIO(add_content))
    df_del = pd.read_excel(BytesIO(del_content))
    df_ctc = pd.read_excel(BytesIO(ctc_content))
    df_pay = pd.read_excel(BytesIO(pay_content))

    # Normalize columns
    df_add.columns = df_add.columns.str.strip().str.lower()
    df_del.columns = df_del.columns.str.strip().str.lower()
    df_ctc.columns = df_ctc.columns.str.strip().str.lower()
    df_pay.columns = df_pay.columns.str.strip().str.lower()

    dojal = dojal.lower()
    doldl = doldl.lower()
    pay_month = "monthyear"  # assume this col exists in Pay Registrar

    # Parse dates
    df_add['doj'] = pd.to_datetime(df_add[dojal], errors='coerce')
    df_del['dol'] = pd.to_datetime(df_del[doldl], errors='coerce')
    df_pay[pay_month] = pd.to_datetime(df_pay[pay_month], errors='coerce')

    # Months Apr-24 → Mar-25
    months = pd.date_range(start="2024-04-01", end="2025-03-01", freq="MS")
    month_labels = [d.strftime('%b-%y') for d in months]

    # Reconciliation loop
    headcount_data = []
    opening = int(opening_apr)
    for month_start in months:
        month_end = month_start + pd.offsets.MonthEnd(1)
        joiners = int(df_add[(df_add['doj'] >= month_start) & (df_add['doj'] <= month_end)].shape[0])
        leavers = int(df_del[(df_del['dol'] >= month_start) & (df_del['dol'] <= month_end)].shape[0])
        closing = int(opening + joiners - leavers)
        headcount_data.append({
            "Month": month_start.strftime('%b-%y'),
            "Opening": int(opening),
            "Joiners": int(joiners),
            "Leavers": int(leavers),
            "Closing": int(closing)
        })
        opening = closing
    headcount_df = pd.DataFrame(headcount_data)

    # Test reconciliation
    closing_mar25 = int(opening)
    ctc_count = int(df_ctc.shape[0])
    diff = int(closing_mar25 - ctc_count)
    test_reco = [
        {"Particulars": "As per Above Headcount", "Employees": int(closing_mar25)},
        {"Particulars": "As per CTC Report", "Employees": int(ctc_count)},
        {"Particulars": "Difference", "Employees": int(diff)},
        {"Particulars": "--User added rows--", "Employees": 0},
        {"Particulars": "Net Difference", "Employees": int(diff)}
    ]

    # Quarterly weighted averages
    quarter_map = {
        "Q1": ["Apr-24", "May-24", "Jun-24"],
        "Q2": ["Jul-24", "Aug-24", "Sep-24"],
        "Q3": ["Oct-24", "Nov-24", "Dec-24"],
        "Q4": ["Jan-25", "Feb-25", "Mar-25"]
    }
    quarterly_weighted = {}
    for q, mths in quarter_map.items():
        weights = [3, 2, 1]
        closing_vals = [int(headcount_df.loc[headcount_df['Month'] == m, "Closing"].values[0]) for m in mths]
        weighted_sum = int(sum(c * w for c, w in zip(closing_vals, weights)))
        quarterly_weighted[q] = {
            "Weighted Figure": int(weighted_sum),
            "Total Weight": 6,
            "Weighted Average": float(round(weighted_sum / 6, 2))
        }

    # Annual weighted avg
    weights_annual = list(range(12, 0, -1))
    closing_vals_annual = [int(headcount_df.loc[headcount_df['Month'] == m, "Closing"].values[0]) for m in month_labels]
    annual_sum = int(sum(c * w for c, w in zip(closing_vals_annual, weights_annual)))
    annual_data = {
        "Year": "FY24-25",
        "Weighted Figure": int(annual_sum),
        "Total Weight": 78,
        "Weighted Average": float(round(annual_sum / 78, 2))
    }

    # Average gross pay quarterly
    gross_quarterly = {}
    for q, mths in quarter_map.items():
        gross_sum = int(df_pay[df_pay[pay_month].dt.strftime('%b-%y').isin(mths)]['gross'].sum())
        weighted_avg_headcount = int(quarterly_weighted[q]['Weighted Average'])
        avg_pay = float(round(gross_sum / weighted_avg_headcount, 2)) if weighted_avg_headcount != 0 else 0.0
        gross_quarterly[q] = {
            "Gross Pay": int(gross_sum),
            "Weighted Average Headcount": int(weighted_avg_headcount),
            "Average Pay": float(avg_pay)
        }

    # Final JSON
    output_data = {
        "Headcount_Reconciliation": headcount_data,
        "Test_Reconciliation": test_reco,
        "Quarterly_Weighted_Average_Headcount": quarterly_weighted,
        "Annual_Weighted_Average_Headcount": annual_data,
        "Average_Gross_Pay_Quarterly": gross_quarterly
    }

    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=4)

    return output_data


# === MAIN ===
def jugg(add_list, del_list, ctc_file, pay_registrar, output_path, opening_apr, dojal, doldl):
    access_token = get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    # 1️⃣ Download input files
    add_content = download_file(headers, drive_id, add_list, "client")
    del_content = download_file(headers, drive_id, del_list, "client")
    ctc_content = download_file(headers, drive_id, ctc_file, "client")
    pay_content = download_file(headers, drive_id, pay_registrar, "client")

    # 2️⃣ Process
    data = run_headcount_reco(add_content, del_content, ctc_content, pay_content,
                       opening_apr, dojal, doldl, output_path=output_path)

    # 3️⃣ Upload result
    remote_name = output_path
    file_web_url = upload_file(headers, drive_id, output_path, remote_name, "juggernaut")

    # 4️⃣ Update db.json
    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers)
    db_data = db_resp.json() if db_resp.status_code == 200 else {"juggernaut": [], "client": [], "tools": [], "rbin": []}

    new_entry = {
        "name": remote_name,
        "url": file_web_url,
        "reference": "Execution Payroll Headcount Reconciliation"
    }
    db_data.setdefault("client", []).append(new_entry)

    updated_db = json.dumps(db_data, indent=4)
    db_upload_resp = requests.put(db_url, headers=headers, data=updated_db.encode("utf-8"))
    db_upload_resp.raise_for_status()

    # Emit compact JSON line with results for Electron
    print(json.dumps({
        "success": True,
        "message": "Execution Payroll Headcount Reconciliation completed",
        "file_web_url": file_web_url,
        "data": data
    }))










