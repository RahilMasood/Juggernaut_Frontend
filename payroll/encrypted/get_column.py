import pandas as pd
import json
from pathlib import Path

def jugg(
    file_path_pr: str,
    sheet_name_pr: str,
    file_path_ctc: str,
    sheet_name_ctc: str,
    output_json_path: str,
):
    field_names = [
        'employee_code',
        'employee_name',
        'designation',
        'pay_month',
        'date_of_joining',
        'date_of_leaving',
        'pan',
        'gross_pay',
        'net_pay',
        'total_deductions',
        'pf',
        'esi'
    ]

    # --- Create mapping ---
    column_map = dict(zip(field_names, ""))

    # --- Read Excel headers only ---
    df_pr = pd.read_excel(file_path_pr, sheet_name = sheet_name_pr, nrows=0)
    df_ctc = pd.read_excel(file_path_ctc, sheet_name = sheet_name_ctc, nrows=0)

    # --- Save JSON ---
    output_data = {
        "column_map": column_map,
        "pr_column_names": df_pr.columns.tolist(),
        "ctc_column_names": df_ctc.columns.tolist()
    }

    Path(output_json_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"✅ Column map saved to: {output_json_path}")
    return output_data


pay_registrar = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Pay Registrar.xlsx"
pay_registrar_sheet = "Consol AIC"
column_map = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\column_map.json"
ctc_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\CTC Report.xlsx"
ctc_sheet = "Data"
jugg(pay_registrar, pay_registrar_sheet, ctc_file, ctc_sheet, column_map)
