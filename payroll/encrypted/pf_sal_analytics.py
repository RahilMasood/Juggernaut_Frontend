import json

# --- Mapping (common for both functions) ---
mapping = {
    ("Lower", "Not relying on controls"): (22, 65),
    ("Higher", "Not relying on controls"): (15, 45),
    ("Lower", "Relying on controls"): (35, 95),
    ("Higher", "Relying on controls"): (25, 90),
    ("Significant", "Relying on controls"): (20, 50)
}


def calculate_pf(data, i_input, ii_input, risk_assessment, control_reliance,
                 per_mat, percentage, output_path):
    """Calculate PF and export results to JSON"""
    pf_ledgers = [item for item in data if item["fs_sub_line_id"] == 20031]

    # Index selection
    i_indices = [int(x) for x in i_input]
    ii_indices = [int(x) for x in ii_input]

    # Selected ledgers
    i_ledgers = [pf_ledgers[idx - 1] for idx in i_indices if 0 < idx <= len(pf_ledgers)]
    ii_ledgers = [pf_ledgers[idx - 1] for idx in ii_indices if 0 < idx <= len(pf_ledgers)]

    # Calculations
    recorded_amount = sum(item["closing_balance"] for item in i_ledgers)
    salary_amount = sum(item["closing_balance"] for item in ii_ledgers)
    expected_pf = (percentage / 100) * salary_amount
    difference = expected_pf - recorded_amount

    rec_amt, pm_pct = mapping[(risk_assessment, control_reliance)]
    rec_value = (rec_amt / 100) * recorded_amount
    pm_value = (pm_pct / 100) * per_mat
    threshold = min(rec_value, pm_value)

    within_threshold = abs(difference) <= threshold

    # Output
    result = {
        "Particulars": {
            "Recorded Amount": recorded_amount,
            "Salary Amount": salary_amount,
            "Percentage": percentage,
            "Expected PF": expected_pf,
            "Difference": difference,
            "Threshold": threshold,
            "Within Threshold": "Yes" if within_threshold else "No"
        },
        "Recorded Amount Ledgers": [l["ledger_name"] for l in i_ledgers],
        "Salary Amount Ledgers": [l["ledger_name"] for l in ii_ledgers],
        "All PF Ledgers": [
            {
                "Index": idx,
                "Ledger Name": ledger["ledger_name"],
                "Closing Balance": ledger["closing_balance"]
            }
            for idx, ledger in enumerate(pf_ledgers, start=1)
        ]
    }

    with open(output_path, "w") as f:
        json.dump(result, f, indent=4)

    print(f"PF calculation saved to {output_path}")
    return result


def calculate_salary(data, risk_assessment, control_reliance, per_mat,
                     weighted_avg_headcount_py, annual_weighted_avg,
                     average_increment, exclude_input, output_path):
    """Calculate Salary and export results to JSON"""
    population = sum(item["closing_balance"] for item in data if item["note_line_id"] == 30152)

    pop_pct, pm_pct = mapping[(risk_assessment, control_reliance)]
    pop_value = (pop_pct / 100) * population
    pm_value = (pm_pct / 100) * per_mat
    threshold = min(pop_value, pm_value)

    # Ledgers for Salaries & Wages
    salary_ledgers = [item for item in data if item["note_line_id"] == 30152]

    # Excluded ledgers
    excluded_ledgers = [
        ledger for ledger in salary_ledgers
        if ledger["ledger_name"].strip().lower() in [name.strip().lower() for name in exclude_input]
    ]

    cy_total = sum(item["closing_balance"] for item in salary_ledgers)
    py_total = sum(item["opening_balance"] for item in salary_ledgers)

    cy_excluded = sum(item["closing_balance"] for item in excluded_ledgers)
    py_excluded = sum(item["opening_balance"] for item in excluded_ledgers)

    cy_net_salary = cy_total - cy_excluded
    py_net_salary = py_total - py_excluded

    salary_expectation = (py_net_salary / weighted_avg_headcount_py * annual_weighted_avg) * (1 + (average_increment / 100))
    difference = salary_expectation - cy_net_salary
    within_threshold = abs(difference) <= threshold

    output_data = {
        "Threshold Calculation": {
            "Selected risk": risk_assessment,
            "Control reliance": control_reliance,
            "Final threshold": threshold
        },
        "Salary Ledgers": [ledger['ledger_name'] for ledger in salary_ledgers],
        "Salary Calculations": {
            "CY Salaries & Wages": cy_total,
            "PY Salaries & Wages": py_total,
            "CY Excluded total": cy_excluded,
            "PY Excluded total": py_excluded,
            "CY Net Salary": cy_net_salary,
            "PY Net Salary": py_net_salary,
            "Salary Expectation": salary_expectation,
            "Difference (Expectation - Actual)": difference,
            "Within Threshold": "Yes" if within_threshold else "No"
        }
    }

    with open(output_path, "w") as outfile:
        json.dump(output_data, outfile, indent=4)

    print(f"Salary calculation saved to {output_path}")
    return output_data


def jugg(
    hc_output_path,
    incr_output_path,
    combined_json_path,
    i_input,
    ii_input,
    risk_assessment,
    control_reliance,
    per_mat,
    percentage,
    weighted_avg_headcount_py,
    exclude_input,
    pf_output_path,
    salary_output_path
):
    # Load inputs
    with open(hc_output_path, "r") as f:
        hc_data = json.load(f)
    with open(incr_output_path, "r") as f:
        ia_data = json.load(f)
    with open(combined_json_path, "r") as f:
        data = json.load(f)["data"]

    # Extract metrics
    annual_weighted_avg = hc_data["Annual_Weighted_Average_Headcount"]["Weighted Average"]

    # Handle % value flexibly (string "12.5%" or float 12.5)
    avg_incr_val = ia_data["Average Increment %"]
    if isinstance(avg_incr_val, str):
        average_increment = round(float(avg_incr_val.strip('%')))
    else:
        average_increment = round(float(avg_incr_val))

    # Call PF calculation
    calculate_pf(
        data,
        i_input,
        ii_input,
        risk_assessment,
        control_reliance,
        per_mat,
        percentage,
        pf_output_path
    )

    # Call Salary calculation
    calculate_salary(
        data,
        risk_assessment,
        control_reliance,
        per_mat,
        weighted_avg_headcount_py,
        annual_weighted_avg,
        average_increment,
        exclude_input,
        salary_output_path
    )



# --- INPUTS ---
risk_assessment = "Higher"
control_reliance = "Relying on controls" if risk_assessment != "Significant" else "Relying on controls"
per_mat = 21600000
percentage = 10
i_input = [24, 62]
ii_input = [25]
weighted_avg_headcount_py = 1601.06
exclude_input = []

# File paths
hc_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Headcount Reconcilation.json"
incr_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Increment_Analysis.json"
combined_json_path = r"C:\Users\shez8\Desktop\Juggernaut\KushalCode\accounting\exports\Combined.json"
pf_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\pf_calculations.json"
salary_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\salary_calculations.json"

jugg(
    hc_path,
    incr_path,
    combined_json_path,
    i_input,
    ii_input,
    risk_assessment,
    control_reliance,
    per_mat,
    percentage,
    weighted_avg_headcount_py,
    exclude_input,
    pf_output_path,
    salary_output_path
)
