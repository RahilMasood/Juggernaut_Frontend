import json
from pathlib import Path

def jugg(output_json_path: str, custom_keys: list):
    field_names = ['employee_code', 'employee_name', 'designation', 'pay_month', 'date_of_joining', 'date_of_leaving', 'pan', 'gross_pay', 'net_pay', 'total_deductions', 'pf', 'esi']

    # --- Validation ---
    if len(custom_keys) != len(field_names):
        raise ValueError("`custom_keys` and `field_names` must have the same length!")

    # --- Create mapping ---
    column_map = dict(zip(field_names, custom_keys))

    # --- Save only column_map ---
    output_data = {"column_map": column_map}
    Path(output_json_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)

    print(f"✅ Column map created in: {output_json_path}")
    return output_data


# Example usage
column_map_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\column_map.json"
ipe_custom_keys = [
    'Pernr', 'Employee Name', 'Design Code', 'MonthYear', 'DOJ', 'DOL',
    'PAN Number', 'Gross', 'Net Pay', 'Ded Tot', 'PROV. FUND', 'E.S.I'
]

jugg(column_map_path, ipe_custom_keys)
