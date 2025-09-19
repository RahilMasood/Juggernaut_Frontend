import pandas as pd
import json

# --- INPUTS ---
actuary_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Actuary Testing.xlsx"
ctc_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\CTC Report.xlsx"
mapping_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Actuary.json"
output_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\CTC_Actuary.xlsx"
actuary_sheet = "Gratuity 31.03.2025"
ctc_sheet = "Data"

def jugg(actuary_file, ctc_file, mapping_file, output_file, actuary_sheet, ctc_sheet):
    # --- READ FILES ---
    df_at = pd.read_excel(actuary_file, sheet_name=actuary_sheet)
    df_ctc = pd.read_excel(ctc_file, sheet_name=ctc_sheet)

    # Clean column names
    df_at.columns = df_at.columns.str.strip()
    df_ctc.columns = df_ctc.columns.str.strip()

    # --- LOAD COLUMN MAPPINGS ---
    with open(mapping_file, "r") as f:
        mapping_data = json.load(f)["column_map"]

    # First mapping is always the ID
    ctc_id_col = mapping_data[0]["CTC"].strip()
    actuary_id_col = mapping_data[0]["Actuary"].strip()

    # --- FIND COMMON IDs ---
    common_ids = set(df_ctc[ctc_id_col]).intersection(set(df_at[actuary_id_col]))

    # Filter common rows
    df_ctc_common = df_ctc[df_ctc[ctc_id_col].isin(common_ids)].copy()
    df_at_common = df_at[df_at[actuary_id_col].isin(common_ids)].copy()

    # Sort and align
    df_ctc_common.sort_values(by=ctc_id_col, inplace=True)
    df_at_common.sort_values(by=actuary_id_col, inplace=True)
    df_ctc_common.reset_index(drop=True, inplace=True)
    df_at_common.reset_index(drop=True, inplace=True)

    # Format datetime columns to "dd-mmm-yyyy" (no timestamp)
    for df in [df_ctc_common, df_at_common]:
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].dt.strftime("%d-%b-%Y")

    # --- Helper: Convert column index to Excel letter ---
    def excel_col_letter(idx):
        letters = ""
        while idx >= 0:
            letters = chr(idx % 26 + 65) + letters
            idx = idx // 26 - 1
        return letters

    # --- BUILD FINAL OUTPUT ---
    final_df = pd.DataFrame()

    # 1. Add CTC columns with suffix
    for mapping in mapping_data:
        col_name_ctc = mapping["CTC"].strip()
        new_name_ctc = f"{col_name_ctc} (CTC)"
        final_df[new_name_ctc] = df_ctc_common[col_name_ctc].values

    # 2. Add blank column
    final_df[""] = ""

    # 3. Add Actuary columns with suffix
    for mapping in mapping_data:
        col_name_at = mapping["Actuary"].strip()
        new_name_at = f"{col_name_at} (Actuary)"
        final_df[new_name_at] = df_at_common[col_name_at].values

    # 4. Add blank column
    final_df[" "] = ""

    # 5. Add Diff columns for non-ID mappings
    for mapping in mapping_data[1:]:  # skip ID column
        ctc_name = f"{mapping['CTC'].strip()} (CTC)"
        at_name = f"{mapping['Actuary'].strip()} (Actuary)"

        ctc_letter = excel_col_letter(final_df.columns.get_loc(ctc_name))
        at_letter = excel_col_letter(final_df.columns.get_loc(at_name))

        diff_name = f"Diff {mapping['CTC'].strip()}"
        final_df[diff_name] = [
            f"={ctc_letter}{i+2} - {at_letter}{i+2}" for i in range(len(final_df))
        ]

    # --- SAVE TO EXCEL ---
    final_df.to_excel(output_file, index=False)
