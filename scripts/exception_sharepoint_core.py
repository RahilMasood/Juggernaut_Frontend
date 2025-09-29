import requests
from msal import ConfidentialClientApplication
import pandas as pd
import json
from datetime import datetime
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


# === PAYROLL EXCEPTION CHECKER ===
def run_exception_checker(pay_registrar_content, column_map_content, expn_no, output_path):
    df = pd.read_excel(BytesIO(pay_registrar_content))
    column_map = json.loads(column_map_content)["column_map"]

    # Format pay_month
    df[column_map['pay_month']] = pd.to_datetime(
        df[column_map['pay_month']], errors='coerce', dayfirst=True
    )

    class PayrollExceptionChecker:
        def __init__(self, df, col_map):
            self.df = df.copy()
            self.col = col_map
            self.exceptions = {}

        def record_exception(self, rule, rows):
            if rule not in self.exceptions:
                self.exceptions[rule] = []
            self.exceptions[rule].extend(rows)

        # --- All your exception checks ---
        def check_exception_1(self):
            inconsistent = self.df.groupby(self.col['employee_code'])[self.col['employee_name']].nunique()
            problem_codes = inconsistent[inconsistent > 1].index.tolist()
            rows = self.df[self.df[self.col['employee_code']].isin(problem_codes)].index.tolist()
            self.record_exception(1, rows)

        def check_exception_2(self):
            duplicates = self.df.duplicated(subset=[self.col['employee_code'], self.col['pay_month']], keep=False)
            rows = self.df[duplicates].index.tolist()
            self.record_exception(2, rows)

        def check_exception_3(self):
            multi_desigs = self.df.groupby(self.col['employee_code'])[self.col['designation']].nunique()
            problem_codes = multi_desigs[multi_desigs > 2].index.tolist()
            rows = self.df[self.df[self.col['employee_code']].isin(problem_codes)].index.tolist()
            self.record_exception(3, rows)

        def check_exception_4(self):
            for _, group in self.df.groupby(self.col['employee_code']):
                leave_dates = group[self.col['date_of_leaving']].dropna().unique()
                if len(leave_dates) == 0:
                    continue
                last_month = max(pd.to_datetime(leave_dates)).to_period("M")
                future_rows = group[pd.to_datetime(group[self.col['pay_month']]).dt.to_period("M") > last_month]
                self.record_exception(4, future_rows.index.tolist())

        def check_exception_5(self):
            for _, group in self.df.groupby(self.col['employee_code']):
                join_dates = group[self.col['date_of_joining']].dropna().unique()
                if len(join_dates) == 0:
                    continue
                join_month = min(pd.to_datetime(join_dates)).to_period("M")
                early_rows = group[pd.to_datetime(group[self.col['pay_month']]).dt.to_period("M") < join_month]
                self.record_exception(5, early_rows.index.tolist())

        def check_exception_6(self):
            pan_group = self.df.groupby(self.col['pan'])[self.col['employee_code']].nunique()
            invalid_pan = pan_group[pan_group > 1].index.tolist()
            rows = self.df[self.df[self.col['pan']].isin(invalid_pan)].index.tolist()
            self.record_exception(6, rows)

        def check_exception_7(self):
            rows = self.df[self.df[self.col['designation']].isna()].index.tolist()
            self.record_exception(7, rows)

        def check_exception_8(self):
            rows = self.df[self.df[self.col['gross_pay']] < self.df[self.col['net_pay']]].index.tolist()
            self.record_exception(8, rows)

        def check_exception_9(self):
            rows = self.df[self.df[self.col['employee_name']].notna() & self.df[self.col['employee_code']].isna()].index.tolist()
            self.record_exception(9, rows)

        def check_exception_10(self):
            calc = self.df[self.col['gross_pay']] - self.df[self.col['total_deductions']]
            rows = self.df[calc < self.df[self.col['net_pay']]].index.tolist()
            self.record_exception(10, rows)

        def check_exception_11(self):
            rows = self.df[self.df[self.col['net_pay']] < 0].index.tolist()
            self.record_exception(11, rows)

        def check_exception_12(self):
            pf_counts = self.df.groupby(self.col['employee_code'])[self.col['pf']].apply(lambda x: x.gt(0).any() and x.eq(0).any())
            problem_codes = pf_counts[pf_counts].index.tolist()
            rows = self.df[self.df[self.col['employee_code']].isin(problem_codes)].index.tolist()
            self.record_exception(12, rows)

        def check_exception_13(self):
            esi_counts = self.df.groupby(self.col['employee_code'])[self.col['esi']].apply(lambda x: x.gt(0).any() and x.eq(0).any())
            problem_codes = esi_counts[esi_counts].index.tolist()
            rows = self.df[self.df[self.col['employee_code']].isin(problem_codes)].index.tolist()
            self.record_exception(13, rows)

        def check_exception_14(self):
            doj_inconsistent = self.df.groupby(self.col['employee_code'])[self.col['date_of_joining']].nunique()
            problem_codes = doj_inconsistent[doj_inconsistent > 1].index.tolist()
            rows = self.df[self.df[self.col['employee_code']].isin(problem_codes)].index.tolist()
            self.record_exception(14, rows)

        def check_exception_15(self):
            dol_inconsistent = self.df.groupby(self.col['employee_code'])[self.col['date_of_leaving']].nunique()
            problem_codes = dol_inconsistent[dol_inconsistent > 1].index.tolist()
            rows = self.df[self.df[self.col['employee_code']].isin(problem_codes)].index.tolist()
            self.record_exception(15, rows)

        def run_checks(self, checks_to_run=None):
            if checks_to_run is None:
                checks_to_run = range(1, 16)
            for i in checks_to_run:
                getattr(self, f"check_exception_{i}")()
            return self.exceptions

    checker = PayrollExceptionChecker(df, column_map)
    results = checker.run_checks(expn_no)

    exception_descriptions = [
        "One employee code does not have more than one employee name.",
        "One employee code does not have two lines with the same month of pay.",
        "One employee code does not have more than 2 designations.",
        "One employee code is not paid for months subsequent to month of resignation.",
        "One employee code is not paid for months before joining date.",
        "Two different employees do not have the same PAN.",
        "Employees having blank designation.",
        "Gross pay is lesser than net pay.",
        "Employees having no employee code.",
        "Instances where gross pay less total deductions is not equal to net pay.",
        "Employee IDs where net pay is negative.",
        "Employee IDs where PF was not there in one month but there in other months.",
        "Employee IDs where ESI is not there in one month but there in previous months.",
        "Employee IDs with different dates of joining",
        "Employee IDs with different dates of leaving"
    ]

    exception_summary = pd.DataFrame({
        "Exception no.": [f"{i}." for i in (expn_no or range(1, 16))],
        "Exception": [exception_descriptions[i - 1] for i in (expn_no or range(1, 16))],
        "Exception count": [len(results.get(i, [])) for i in (expn_no or range(1, 16))]
    })

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Data", index=False)
        exception_summary.to_excel(writer, sheet_name="Exception Summary", index=False)
        for rule_no, row_indices in results.items():
            if row_indices:
                exception_df = df.loc[row_indices].copy()
                writer.book.create_sheet(f"Exception_{rule_no}")
                exception_df.to_excel(writer, sheet_name=f"Exception_{rule_no}", index=False)

        workbook = writer.book
        for sheetname in workbook.sheetnames:
            worksheet = workbook[sheetname]
            for row in worksheet.iter_rows():
                for cell in row:
                    if isinstance(cell.value, datetime):
                        cell.number_format = "DD/MM/YYYY"


# === MAIN ===
def jugg(pay_registrar_name, expn_no):
    access_token = get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    # --- 1️⃣ Download pay_registrar and column_map
    pay_registrar_content = download_file(headers, drive_id, pay_registrar_name, "client")
    column_map_content = download_file(headers, drive_id, "Execution_Payroll_PRColumnMap.json", "juggernaut")

    # --- 2️⃣ Process & generate output
    output_path = "Execution_Payroll_ExceptionTesting.xlsx"
    run_exception_checker(pay_registrar_content, column_map_content, expn_no, output_path)

    # --- 3️⃣ Upload output file
    remote_name = "Execution_Payroll_ExceptionTesting.xlsx"
    file_web_url = upload_file(headers, drive_id, output_path, remote_name, "client")

    # --- 4️⃣ Update db.json ---
    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers)

    if db_resp.status_code == 200:
        db_data = db_resp.json()
    else:
        # If db.json doesn’t exist, create empty structure
        db_data = {"juggernaut": [], "client": [], "tools": [], "rbin": []}

    new_entry = {
        "name": remote_name,
        "url": file_web_url,
        "reference": "Execution Payroll Exception Testing"
    }

    if "client" in db_data:
        db_data["client"].append(new_entry)
    else:
        db_data["client"] = [new_entry]

    updated_db_content = json.dumps(db_data, indent=4)
    db_upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_upload_resp = requests.put(db_upload_url, headers=headers, data=updated_db_content.encode("utf-8"))
    db_upload_resp.raise_for_status()

    # Emit a compact JSON result line to stdout for the Electron UI to parse
    print(json.dumps({
        "success": True,
        "message": "Execution Payroll Exception Testing completed",
        "file_web_url": file_web_url
    }))

