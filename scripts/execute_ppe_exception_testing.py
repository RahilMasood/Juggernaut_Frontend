import requests
from msal import ConfidentialClientApplication
import pandas as pd
import json
from datetime import datetime, date
from dateutil import parser
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


def upload_file(headers, drive_id, local_path, remote_name, folder_name):
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{remote_name}:/content"
    with open(local_path, "rb") as f:
        data = f.read()
    resp = requests.put(upload_url, headers=headers, data=data)
    resp.raise_for_status()
    return resp.json().get("webUrl")


class FARExceptionChecker:
    def __init__(self, df_cur, df_prev, col_map):
        self.df = df_cur.copy()
        self.df_prev = df_prev.copy() if df_prev is not None else pd.DataFrame()
        self.col = col_map
        self.exceptions = {}

    @staticmethod
    def safe_parse(date_val):
        if pd.isna(date_val):
            return None
        if isinstance(date_val, (pd.Timestamp, datetime, date)):
            return date_val.date()
        try:
            return parser.parse(str(date_val), dayfirst=True).date()
        except Exception:
            try:
                return parser.parse(str(date_val), dayfirst=False).date()
            except Exception:
                return None

    def record_exception(self, rule, rows):
        if rule not in self.exceptions:
            self.exceptions[rule] = []
        self.exceptions[rule].extend(rows)

    def check_exception_1(self):
        try:
            rows = self.df[self.df[self.col['net_book_value']] == self.df[self.col['original_cost']]].index.tolist()
            self.record_exception(1, rows)
        except KeyError:
            pass

    def check_exception_2(self):
        try:
            life_col = self.col['useful_life']
            self.df[life_col] = pd.to_numeric(self.df[life_col], errors="coerce")
            rows = self.df[(self.df[life_col].isna()) | (self.df[life_col] == 0)].index.tolist()
            self.record_exception(2, rows)
        except KeyError:
            pass

    def check_exception_3(self):
        try:
            rows = self.df[self.df[self.col['accumulated_depreciation']].abs() > self.df[self.col['original_cost']]].index.tolist()
            self.record_exception(3, rows)
        except KeyError:
            pass

    def check_exception_4(self):
        try:
            life_col = self.col['useful_life']
            self.df[life_col] = pd.to_numeric(self.df[life_col], errors="coerce")
            rows = self.df[self.df[life_col] < 1].index.tolist()
            self.record_exception(4, rows)
        except KeyError:
            pass

    def check_exception_5(self):
        if self.df_prev.empty:
            return
        try:
            asset_col = self.col['asset_code']
            cap_col = self.col['capitalization_date']
            cur = self.df[[asset_col, cap_col]].copy()
            prv = self.df_prev[[asset_col, cap_col]].copy()
            def parse_series(s):
                return s.map(self.safe_parse)
            cur[cap_col] = parse_series(cur[cap_col])
            prv[cap_col] = parse_series(prv[cap_col])
            cur_1 = cur.dropna(subset=[cap_col]).drop_duplicates(subset=[asset_col], keep="first")
            prv_1 = prv.dropna(subset=[cap_col]).drop_duplicates(subset=[asset_col], keep="first")
            merged = cur_1.merge(prv_1, on=asset_col, how="inner", suffixes=("_cur", "_prev"))
            mismatch_codes = merged.loc[merged[f"{cap_col}_cur"] != merged[f"{cap_col}_prev"], asset_col].unique().tolist()
            rows = self.df.index[self.df[asset_col].isin(mismatch_codes)].tolist()
            self.record_exception(5, rows)
        except KeyError:
            pass

    def check_exception_6(self, current_fy_start, current_fy_end):
        if self.df_prev.empty:
            return
        try:
            prev_assets = self.df_prev[self.col['asset_code']].unique().tolist()
            exception_rows = []
            for idx, row in self.df.iterrows():
                asset_code = row[self.col['asset_code']]
                cap_date = self.safe_parse(row[self.col['capitalization_date']])
                if not cap_date:
                    continue
                if asset_code not in prev_assets:
                    if not (current_fy_start.date() <= cap_date <= current_fy_end.date()):
                        exception_rows.append(idx)
            self.record_exception(6, exception_rows)
        except KeyError:
            pass

    def run_checks(self, current_fy_start, current_fy_end, checks_to_run=None):
        if checks_to_run is None:
            checks_to_run = range(1, 7)
        for i in checks_to_run:
            if i == 6:
                self.check_exception_6(current_fy_start, current_fy_end)
            else:
                getattr(self, f"check_exception_{i}")()
        return self.exceptions


def run_far_exception_checker(df_cur, df_prev, column_map, expn_no):
    today = datetime.today()
    if today.month >= 4:
        current_fy_start = datetime(today.year - 1, 4, 1)
        current_fy_end = datetime(today.year, 3, 31)
    else:
        current_fy_start = datetime(today.year - 2, 4, 1)
        current_fy_end = datetime(today.year - 1, 3, 31)

    checker = FARExceptionChecker(df_cur, df_prev, column_map)
    results = checker.run_checks(current_fy_start, current_fy_end, expn_no)

    exception_descriptions = {
        1: "Net book value should not be equal to original cost.",
        2: "Useful life cannot be zero or blank.",
        3: "Accumulated depreciation should not exceed original cost.",
        4: "Useful life should not be less than 1 year.",
        5: "Capitalization date mismatch with previous year",
        6: "Capitalization date must lie within current FY",
    }

    selected_exceptions = expn_no or range(1, 7)
    exception_summary = pd.DataFrame({
        "Exception no.": [f"{i}." for i in selected_exceptions],
        "Exception": [exception_descriptions[i] for i in selected_exceptions],
        "Exception count": [len(results.get(i, [])) for i in selected_exceptions]
    })

    output_buffer = BytesIO()
    with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
        df_cur.to_excel(writer, sheet_name="Data_Cur", index=False)
        df_prev.to_excel(writer, sheet_name="Data_Prev", index=False)
        exception_summary.to_excel(writer, sheet_name="Exception Summary", index=False)
        for rule_no, row_indices in results.items():
            if row_indices:
                exception_df = df_cur.loc[row_indices].copy()
                exception_df.to_excel(writer, sheet_name=f"Exception_{rule_no}", index=False)

    output_buffer.seek(0)
    return output_buffer


def jugg(file_cur_name, file_prev_name, expn_no):
    access_token = get_token()
    headers = {"Authorization": f"Bearer {access_token}"}
    drive_id = get_drive_id(headers)

    print(f"Downloading current FAR file: {file_cur_name}")
    cur_content = download_file(headers, drive_id, file_cur_name, "client")
    print(f"Downloading previous FAR file: {file_prev_name}")
    prev_content = download_file(headers, drive_id, file_prev_name, "client")
    print("Downloading column map...")
    column_map_content = download_file(headers, drive_id, "Execution_PPE_ColumnMap.json", "juggernaut")

    print("Reading Excel files...")
    df_cur = pd.read_excel(BytesIO(cur_content))
    df_prev = pd.read_excel(BytesIO(prev_content))

    def fix_duplicate_columns(columns):
        seen = {}
        new_columns = []
        for col in columns:
            if col in seen:
                seen[col] += 1
                new_columns.append(f"{col}_{seen[col]}")
            else:
                seen[col] = 0
                new_columns.append(col)
        return new_columns

    print(f"Current FAR columns: {list(df_cur.columns)}")
    print(f"Previous FAR columns: {list(df_prev.columns)}")
    df_cur.columns = fix_duplicate_columns(df_cur.columns)
    df_prev.columns = fix_duplicate_columns(df_prev.columns)
    print(f"Fixed current FAR columns: {list(df_cur.columns)}")
    print(f"Fixed previous FAR columns: {list(df_prev.columns)}")

    column_map = json.loads(column_map_content)["column_map"]
    print(f"Column map: {column_map}")

    print("Running exception checks...")
    output_buffer = run_far_exception_checker(df_cur, df_prev, column_map, expn_no)

    remote_name = "Execution_PPE_ExceptionTesting.xlsx"
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/client/{remote_name}:/content"
    resp = requests.put(upload_url, headers=headers, data=output_buffer.getvalue())
    resp.raise_for_status()
    file_web_url = resp.json().get("webUrl")

    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers)
    db_data = db_resp.json() if db_resp.status_code == 200 else {"juggernaut": [], "client": [], "tools": [], "rbin": []}
    new_entry = {"name": remote_name, "url": file_web_url, "reference": "Execution PPE Exception Testing"}
    db_data["client"].append(new_entry)
    updated_db_content = json.dumps(db_data, indent=4)
    db_upload_resp = requests.put(db_url, headers=headers, data=updated_db_content.encode("utf-8"))
    db_upload_resp.raise_for_status()

    print("✅ Uploaded file:", file_web_url)
    print("✅ db.json updated with new entry")
    return file_web_url


def main():
    payload = None
    if len(sys.argv) >= 3:
        cfg_path = sys.argv[2]
        try:
            with open(cfg_path, 'r', encoding='utf-8') as f:
                payload = json.load(f)
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Failed to read config: {e}"}))
            sys.exit(1)

    if not payload:
        print(json.dumps({"success": False, "error": "Missing config payload"}))
        sys.exit(1)

    opts = payload.get("options", payload)
    current_far_file = opts.get("current_far_file", "")
    previous_far_file = opts.get("previous_far_file", "")
    exception_numbers = opts.get("exception_numbers", [])

    try:
        print("Starting PPE Exception Testing...")
        print(f"Current FAR file: {current_far_file}")
        print(f"Previous FAR file: {previous_far_file}")
        print(f"Exception numbers: {exception_numbers}")
        file_web_url = jugg(current_far_file, previous_far_file, exception_numbers)
        print(f"✅ Success! File uploaded to: {file_web_url}")
        print(json.dumps({"success": True, "file_web_url": file_web_url}))
        sys.exit(0)
    except Exception as e:
        import traceback
        print(f"❌ Error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
