import pandas as pd
import json

# --- INPUTS ---
column_map = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\column_map.json"
add_list = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Additions List.xlsx"
del_list = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Deletions List.xlsx"
ctc_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\CTC Report.xlsx"
pay_registrar = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Pay Registrar.xlsx"
add_list_sheet = "New joiners"
del_list_sheet = "Resignees"
ctc_file_sheet = "Data"
pay_registrar_sheet = "Consol AIC"
opening_apr = 2000
dojal = 'Date of joining'
doldl = 'Leaving date'
output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Headcount Reconcilation.json"


def jugg(
    column_map,
    add_list,
    del_list,
    ctc_file,
    pay_registrar,
    add_list_sheet,
    del_list_sheet,
    ctc_file_sheet,
    pay_registrar_sheet,
    opening_apr,
    dojal,
    doldl,
    output_path
):
    with open(column_map, "r") as f:
        cm_data = json.load(f)
    pay_month = cm_data["column_map"]["pay_month"].lower()

    dojal = dojal.lower()
    doldl = doldl.lower()
    # --- LOAD DATA ---
    df_add = pd.read_excel(add_list, sheet_name = add_list_sheet)
    df_del = pd.read_excel(del_list, sheet_name = del_list_sheet)
    df_ctc = pd.read_excel(ctc_file, sheet_name = ctc_file_sheet)
    df_pay = pd.read_excel(pay_registrar, sheet_name = pay_registrar_sheet)

    # Normalize column names
    df_add.columns = df_add.columns.str.strip().str.lower()
    df_del.columns = df_del.columns.str.strip().str.lower()
    df_ctc.columns = df_ctc.columns.str.strip().str.lower()
    df_pay.columns = df_pay.columns.str.strip().str.lower()

    # --- DATE COLUMNS ---
    df_add['doj'] = pd.to_datetime(df_add[dojal], errors='coerce')
    df_del['dol'] = pd.to_datetime(df_del[doldl], errors='coerce')
    df_pay[pay_month] = pd.to_datetime(df_pay[pay_month], errors='coerce')

    # --- MONTHS LIST (Apr-24 to Mar-25) ---
    months = pd.date_range(start="2024-04-01", end="2025-03-01", freq='MS')
    month_labels = [d.strftime('%b-%y') for d in months]

    # --- HEADCOUNT RECONCILIATION ---
    headcount_data = []
    opening = opening_apr

    for month_start in months:
        month_end = month_start + pd.offsets.MonthEnd(1)

        # Joiners from Additions List
        joiners = df_add[df_add['doj'].notna() &
                        (df_add['doj'] >= month_start) &
                        (df_add['doj'] <= month_end)].shape[0]

        # Leavers from Deletions List
        leavers = df_del[df_del['dol'].notna() &
                        (df_del['dol'] >= month_start) &
                        (df_del['dol'] <= month_end)].shape[0]

        closing = opening + joiners - leavers

        headcount_data.append({
            "Month": month_start.strftime('%b-%y'),
            "Opening": opening,
            "Joiners": joiners,
            "Leavers": leavers,
            "Closing": closing
        })
        opening = closing

    headcount_df = pd.DataFrame(headcount_data)

    # --- TEST RECONCILIATION ---
    closing_mar25 = opening
    ctc_count = int(df_ctc.shape[0])
    diff = closing_mar25 - ctc_count

    test_reco = [
        {"Particulars": "As per Above Headcount", "Employees": closing_mar25},
        {"Particulars": "As per CTC Report", "Employees": ctc_count},
        {"Particulars": "Difference", "Employees": diff},
        {"Particulars": "--User added rows--", "Employees": 0},
        {"Particulars": "Net Difference", "Employees": diff - 0}
    ]

    # --- QUARTERLY WEIGHTED AVERAGE HEADCOUNT ---
    quarter_map = {
        "Q1": ["Apr-24", "May-24", "Jun-24"],
        "Q2": ["Jul-24", "Aug-24", "Sep-24"],
        "Q3": ["Oct-24", "Nov-24", "Dec-24"],
        "Q4": ["Jan-25", "Feb-25", "Mar-25"]
    }

    quarterly_weighted = {}
    for q, mths in quarter_map.items():
        weights = [3, 2, 1]
        closing_vals = [headcount_df.loc[headcount_df['Month'] == m, "Closing"].values[0] for m in mths]
        weighted_sum = int(sum(c * w for c, w in zip(closing_vals, weights)))
        weighted_avg = weighted_sum / 6
        quarterly_weighted[q] = {
            "Weighted Figure": weighted_sum,
            "Total Weight": 6,
            "Weighted Average": round(weighted_avg, 2)
        }

    # --- ANNUAL WEIGHTED AVERAGE HEADCOUNT ---
    weights_annual = list(range(12, 0, -1))
    closing_vals_annual = [headcount_df.loc[headcount_df['Month'] == m, "Closing"].values[0] for m in month_labels]
    annual_weighted_sum = int(sum(c * w for c, w in zip(closing_vals_annual, weights_annual)))
    annual_weighted_avg = annual_weighted_sum / 78
    annual_data = {
        "Year": "FY24-25",
        "Weighted Figure": annual_weighted_sum,
        "Total Weight": 78,
        "Weighted Average": round(annual_weighted_avg, 2)
    }

    # --- AVERAGE GROSS PAY – QUARTERLY ---
    gross_quarterly = {}
    for q, mths in quarter_map.items():
        gross_sum = int(df_pay[df_pay[pay_month].dt.strftime('%b-%y').isin(mths)]['gross'].sum())
        gross_quarterly[q] = {
            "Gross Pay": round(gross_sum, 2),
            "Weighted Average Headcount": int(quarterly_weighted[q]['Weighted Average']),
            "Average Pay": round(int(gross_sum / quarterly_weighted[q]['Weighted Average']), 2)
                        if quarterly_weighted[q]['Weighted Average'] != 0 else 0
        }

    # --- FINAL OUTPUT DATA ---
    output_data = {
        "Headcount_Reconciliation": headcount_df.to_dict(orient='records'),
        "Test_Reconciliation": test_reco,
        "Quarterly_Weighted_Average_Headcount": quarterly_weighted,
        "Annual_Weighted_Average_Headcount": annual_data,
        "Average_Gross_Pay_Quarterly": gross_quarterly
    }

    # Save as JSON file
    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=4)
