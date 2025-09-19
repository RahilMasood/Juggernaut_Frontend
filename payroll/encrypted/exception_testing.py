import pandas as pd
import json
from datetime import datetime

def jugg(pay_registrar, output_path, column_map_path, pay_registrar_sheet, expn_no):
    # Load column map
    with open(column_map_path, "r") as f:
        column_data = json.load(f)
    column_map = column_data['column_map']

    # Load data
    df = pd.read_excel(pay_registrar, sheet_name=pay_registrar_sheet)

    # Format pay_month
    df[column_map['pay_month']] = pd.to_datetime(
        df[column_map['pay_month']], errors='coerce', dayfirst=True
    )

    # === PAYROLL EXCEPTION CHECKER ===
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
                checks_to_run = range(1, 16)  # run all if not specified
            for i in checks_to_run:
                getattr(self, f"check_exception_{i}")()
            return self.exceptions

    # --- RUN CHECKS ---
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

    # Create summary only for selected exceptions
    exception_summary = pd.DataFrame({
        "Exception no.": [f"{i}." for i in (expn_no or range(1, 16))],
        "Exception": [exception_descriptions[i - 1] for i in (expn_no or range(1, 16))],
        "Exception count": [len(results.get(i, [])) for i in (expn_no or range(1, 16))]
    })

    # Write to Excel
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
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

# --- INPUTS ---
pay_registrar = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Pay Registrar.xlsx"
output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Exception Testing 2.xlsx"
column_map_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\column_map.json"
pay_registrar_sheet = "Consol AIC"
expn_no = [1,2,3,4,5,7,8,9,10,11,12,13]
jugg(pay_registrar, output_path, column_map_path, pay_registrar_sheet, expn_no)
