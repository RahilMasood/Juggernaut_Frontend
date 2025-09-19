import pandas as pd
import json

# --- INPUTS ---
actuary_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Actuary Testing.xlsx"
actuary_sheet = "Gratuity 31.03.2025"
ctc_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\CTC Report.xlsx"
ctc_sheet = "Data"
output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\actuary_testing.json"

def jugg(actuary_file, actuary_sheet, ctc_file, ctc_sheet, output_path):
    # Read Excel files
    df_at = pd.read_excel(actuary_file, actuary_sheet)
    df_ctc = pd.read_excel(ctc_file, ctc_sheet)

    # Row counts
    row_ctc = len(df_ctc.dropna(how="all"))
    row_at = len(df_at.dropna(how="all"))
    diff = row_at - row_ctc

    # User rows
    usr_rows = 0
    net_diff = diff - usr_rows

    # Prepare dictionary
    output_data = {
        "Actuary_rows": row_at,
        "CTC_Report_rows": row_ctc,
        "Difference": diff,
        "User_Rows": usr_rows,
        "Net_Difference": net_diff,
        "Actuary_columns": list(df_at.columns),
        "CTC_Report_columns": list(df_ctc.columns)
    }

    # Save as JSON file
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(output_data, json_file, indent=4, ensure_ascii=False)
