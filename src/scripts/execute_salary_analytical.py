import requests
from msal import ConfidentialClientApplication
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

# --- Mapping ---
mapping = {
    ("Lower", "Not relying on controls"): (22, 65),
    ("Higher", "Not relying on controls"): (15, 45),
    ("Lower", "Relying on controls"): (35, 95),
    ("Higher", "Relying on controls"): (25, 90),
    ("Significant", "Relying on controls"): (20, 50)
}

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

def download_json(headers, drive_id, file_name, folder_name):
    url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.json()

def upload_json(headers, drive_id, data, remote_name, folder_name):
    buffer = BytesIO(json.dumps(data, indent=4).encode("utf-8"))
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{remote_name}:/content"
    resp = requests.put(upload_url, headers=headers, data=buffer.getvalue())
    resp.raise_for_status()
    return resp.json().get("webUrl")

# === CALCULATIONS ===
def calculate_pf(data, i_input, ii_input, risk_assessment, control_reliance, per_mat, percentage):
    pf_ledgers = [item for item in data if item["fs_sub_line_id"] == 20031]

    i_ledgers = [pf_ledgers[idx] for idx in i_input if 0 < idx <= len(pf_ledgers)]
    ii_ledgers = [pf_ledgers[idx] for idx in ii_input if 0 < idx <= len(pf_ledgers)]

    recorded_amount = sum(item["closing_balance"] for item in i_ledgers)
    salary_amount = sum(item["closing_balance"] for item in ii_ledgers)
    expected_pf = (percentage / 100) * salary_amount
    difference = expected_pf - recorded_amount

    rec_amt, pm_pct = mapping[(risk_assessment, control_reliance)]
    rec_value = (rec_amt / 100) * recorded_amount
    pm_value = (pm_pct / 100) * per_mat
    threshold = min(rec_value, pm_value)

    return {
        "PF_Analytics": {
            "Recorded_Amount": recorded_amount,
            "Salary_Amount": salary_amount,
            "Percentage": percentage,
            "Expected_PF": expected_pf,
            "Difference": difference,
            "Threshold": threshold,
            "Within_Threshold": "Yes" if abs(difference) <= threshold else "No"
        }
    }

def calculate_salary(data, risk_assessment, control_reliance, per_mat,
                     weighted_avg_headcount_py, annual_weighted_avg,
                     average_increment, exclude_input):
    population = sum(item["closing_balance"] for item in data if item["note_line_id"] == 30152)

    pop_pct, pm_pct = mapping[(risk_assessment, control_reliance)]
    pop_value = (pop_pct / 100) * population
    pm_value = (pm_pct / 100) * per_mat
    threshold = min(pop_value, pm_value)

    salary_ledgers = [item for item in data if item["note_line_id"] == 30152]
    excluded_ledgers = [
        l for l in salary_ledgers
        if l["ledger_name"].strip().lower() in [e.strip().lower() for e in exclude_input]
    ]

    cy_total = sum(item["closing_balance"] for item in salary_ledgers)
    py_total = sum(item["opening_balance"] for item in salary_ledgers)
    cy_excluded = sum(item["closing_balance"] for item in excluded_ledgers)
    py_excluded = sum(item["opening_balance"] for item in excluded_ledgers)

    cy_net_salary = cy_total - cy_excluded
    py_net_salary = py_total - py_excluded

    salary_expectation = (py_net_salary / weighted_avg_headcount_py * annual_weighted_avg) * (1 + (average_increment / 100))
    difference = salary_expectation - cy_net_salary

    return {
        "Salary_Calculations": {
            "Selected_risk": risk_assessment,
            "Control_reliance": control_reliance,
            "Final_threshold": threshold,
            "CY_Salaries_Wages": cy_total,
            "PY_Salaries_Wages": py_total,
            "CY_Excluded_total": cy_excluded,
            "PY_Excluded_total": py_excluded,
            "CY_Net_Salary": cy_net_salary,
            "PY_Net_Salary": py_net_salary,
            "Salary_Expectation": salary_expectation,
            "Difference": difference,
            "Within_Threshold": "Yes" if abs(difference) <= threshold else "No"
        }
    }

# === MAIN ===
def main():
    import sys
    
    # Try to read input from stdin (JSON from Electron)
    inputs = None
    try:
        data = sys.stdin.read().strip()
        if data:
            inputs = json.loads(data)
    except Exception:
        inputs = None
    
    # Fallback to command line arguments
    if not inputs and len(sys.argv) > 1:
        try:
            inputs = json.loads(sys.argv[1])
        except Exception:
            inputs = None
    
    # Default values if no input provided
    if not inputs:
        inputs = {
            "risk_assessment": "Higher",
            "control_reliance": "Relying on controls",
            "per_mat": 21600000,
            "weighted_avg_headcount_py": 1601.06,
            "percentage": 10,
            "i_input": [23, 61],
            "ii_input": [24],
            "exclude_input": []
        }
    
    try:
        risk_assessment = inputs["risk_assessment"]
        control_reliance = inputs["control_reliance"]
        per_mat = inputs["per_mat"]
        percentage = inputs["percentage"]
        i_input = inputs["i_input"]
        ii_input = inputs["ii_input"]
        weighted_avg_headcount_py = inputs["weighted_avg_headcount_py"]
        exclude_input = inputs["exclude_input"]

        access_token = get_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        drive_id = get_drive_id(headers)

        # Load SharePoint inputs
        hc_data = download_json(headers, drive_id, "Execution_Payroll_HeadcountReconcilation.json", "juggernaut")
        ia_data = download_json(headers, drive_id, "Execution_Payroll_IncrementAnalysis.json", "juggernaut")
        fin_data = download_json(headers, drive_id, "FinData_LedgerMapping.json", "juggernaut")["data"]

        # Extract metrics
        annual_weighted_avg = hc_data["Annual_Weighted_Average_Headcount"]["Weighted Average"]
        avg_incr_val = ia_data["Average Increment %"]
        average_increment = round(float(avg_incr_val.strip('%'))) if isinstance(avg_incr_val, str) else round(float(avg_incr_val))

        # Run calculations
        pf_result = calculate_pf(fin_data, i_input, ii_input, risk_assessment, control_reliance, per_mat, percentage)
        salary_result = calculate_salary(fin_data, risk_assessment, control_reliance, per_mat,
                                         weighted_avg_headcount_py, annual_weighted_avg,
                                         average_increment, exclude_input)

        final_result = {"PF": pf_result, "Salary": salary_result}

        # Upload result JSON
        json_url = upload_json(headers, drive_id, final_result, "Execution_Payroll_PFSal.json", "juggernaut")

        # Update db.json
        db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
        db_resp = requests.get(db_url, headers=headers)
        db_data = db_resp.json() if db_resp.status_code == 200 else {"juggernaut": [], "client": [], "tools": [], "rbin": []}
        db_data["juggernaut"].append({"name": "Execution_Payroll_PFSal.json", "url": json_url, "reference": ""})
        requests.put(db_url, headers=headers, data=json.dumps(db_data, indent=4).encode("utf-8"))

        print(json.dumps({"success": True, "file_web_url": json_url}))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
