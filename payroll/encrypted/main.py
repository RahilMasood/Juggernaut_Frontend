import get_column
import ipe_testing
import exception_testing
import headcount_reco
import mom_analysis
import increment
import pf_sal_analytics
import actuary_test
import accuracy_check
import pandas as pd

pay_registrar = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Pay Registrar.xlsx"
print(pd.ExcelFile(pay_registrar).sheet_names)
pay_registrar_sheet = "Consol AIC"
add_list = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Additions List.xlsx"
print(pd.ExcelFile(add_list).sheet_names)
dojal = "Date of joining"
add_list_sheet="New joiners"
del_list = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Deletions List.xlsx"
print(pd.ExcelFile(del_list).sheet_names)
doldl = "Leaving date"
del_list_sheet="Resignees"
ctc_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\CTC Report.xlsx"
print(pd.ExcelFile(ctc_file).sheet_names)
ctc_sheet = "Data"
ctc_py_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\CTC Report Prev year.xlsx"
print(pd.ExcelFile(ctc_py_file).sheet_names)
ctc_py_sheet = "Data"
actuary_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Inputs\Actuary Testing.xlsx"
print(pd.ExcelFile(actuary_file).sheet_names)
actuary_sheet = "Gratuity 31.03.2025"

column_map = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\column_map.json"
ipe_custom_keys = ['Pernr', 'Employee Name', 'Design Code', 'MonthYear', 'DOJ', 'DOL', 'PAN Number', 'Gross', 'Net Pay', 'Ded Tot', 'PROV. FUND', 'E.S.I']
ipe_testing.jugg(column_map, ipe_custom_keys)


expn_no = [1,2,3,4,5,7,8,9,10,11,12,13]
ex_ts_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Exception Testing.xlsx"
exception_testing.jugg(pay_registrar, ex_ts_output_path, column_map, pay_registrar_sheet, expn_no)


hc_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Headcount Reconcilation.json"
opening_apr = 2000
headcount_reco.jugg(column_map, add_list, del_list, ctc_file, pay_registrar, add_list_sheet, del_list_sheet, ctc_sheet, pay_registrar_sheet, opening_apr, dojal, doldl, hc_output_path)


mom_display_cols = ['Pernr', 'Employee Name', 'DOJ', 'DOL']
mom_calc_cols = ['BASIC', 'H R A']
mom_incr_month = 'Nov-24'
mom_output_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Mom Increment.xlsx"
mom_analysis.jugg(pay_registrar, pay_registrar_sheet, column_map, mom_output_file, mom_display_cols, mom_calc_cols, mom_incr_month)


incr_columns = ["Emp. No", "Emp. Name", "DOJ", "Department"]
incr_cols_to_sum = ["Monthly CTC"]
incr_rec_inp = 0
incr_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\Increment_Analysis.json"
increment.jugg(ctc_file, ctc_sheet, ctc_py_file, ctc_py_sheet, mom_output_file, incr_columns, incr_cols_to_sum, incr_rec_inp, incr_output_path)


risk_assessment = "Higher"
control_reliance = "Relying on controls" if risk_assessment != "Significant" else "Relying on controls"
per_mat = 21600000
percentage = 10
i_input = [24, 62]
ii_input = [25]
weighted_avg_headcount_py = 1601.06
exclude_input = []
combined_json_path = r"C:\Users\shez8\Desktop\Juggernaut\KushalCode\accounting\exports\Combined.json"
pf_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\pf_calculations.json"
salary_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\salary_calculations.json"
pf_sal_analytics.jugg(hc_output_path, incr_output_path, combined_json_path, i_input, ii_input, risk_assessment, control_reliance, per_mat, percentage, weighted_avg_headcount_py, exclude_input, pf_output_path, salary_output_path)


acc_ts_output_path = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\actuary_testing.json"
actuary_test.jugg(actuary_file, actuary_sheet, ctc_file, ctc_sheet, acc_ts_output_path)


acc_ck_output_file = r"C:\Users\shez8\Desktop\Juggernaut\Execution\1 Payroll\Outputs\CTC_Actuary.xlsx"
accuracy_check.jugg(actuary_file, ctc_file, column_map, acc_ck_output_file, actuary_sheet, ctc_sheet)
