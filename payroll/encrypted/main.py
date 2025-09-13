import json
import sys
import os
import traceback
import logging
import pandas as pd

import get_column
import ipe_testing
import exception_testing
import headcount_reco
import mom_analysis
import increment
import pf_sal_analytics
import actuary_test
import accuracy_check

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('payroll_execution.log', mode='w')
    ]
)


def load_config(config_path):
    """Load configuration from JSON file"""
    logging.info(f"Loading configuration from: {config_path}")
    try:
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(config_path, 'r') as f:
            config = json.load(f)

        logging.info(f"Configuration loaded successfully: {json.dumps(config, indent=2)}")
        return config
    except Exception as e:
        logging.error(f"Failed to load configuration: {str(e)}")
        raise


def validate_config(config, required_keys):
    """Validate that required configuration keys are present"""
    missing_keys = []
    for key in required_keys:
        if key not in config or config[key] is None:
            missing_keys.append(key)

    if missing_keys:
        raise ValueError(f"Missing required configuration keys: {missing_keys}")

    # Validate file paths exist
    file_keys = [
        'pay_registrar', 'ctc_file', 'ctc_py_file',
        'add_list', 'del_list', 'actuary_file', 'combined_json_path'
    ]
    for key in file_keys:
        if key in config and config[key]:
            if not os.path.exists(config[key]):
                logging.warning(f"File path does not exist: {config[key]} (key: {key})")
            else:
                logging.info(f"File validated: {config[key]} (key: {key})")

    logging.info("Configuration validation completed successfully")


def display_excel_sheets(file_path, label):
    """Display available sheet names for a given Excel file"""
    try:
        sheets = pd.ExcelFile(file_path).sheet_names
        logging.info(f"Available sheets in {label} ({file_path}): {sheets}")
        print(f"\nAvailable sheets in {label}: {sheets}")
        return sheets
    except Exception as e:
        logging.error(f"Error reading Excel file {file_path}: {str(e)}")
        return []


def run_module(module_id, config):
    """Run a specific module based on module_id and configuration"""
    logging.info(f"Starting execution of module: {module_id}")

    try:
        # Create outputs directory if it doesn't exist
        output_dir = config.get('output_directory', 'Outputs')
        os.makedirs(output_dir, exist_ok=True)
        logging.info(f"Output directory created/verified: {output_dir}")

        # === NEW FEATURE: Display available sheet names ===
        display_excel_sheets(config.get('pay_registrar', ''), "Pay Registrar")
        display_excel_sheets(config.get('add_list', ''), "Additions List")
        display_excel_sheets(config.get('del_list', ''), "Deletions List")
        display_excel_sheets(config.get('ctc_file', ''), "CTC Report")
        display_excel_sheets(config.get('ctc_py_file', ''), "CTC Report Prev Year")
        display_excel_sheets(config.get('actuary_file', ''), "Actuary Testing")

        if module_id == "get_column":
            validate_config(config, ['pay_registrar', 'pay_registrar_sheet', 'ctc_file', 'ctc_sheet'])

            column_map_path = os.path.join(output_dir, "column_map.json")
            logging.info(f"Generating column mapping to: {column_map_path}")

            get_column.jugg(
                config['pay_registrar'],
                config['pay_registrar_sheet'],
                config['ctc_file'],
                config['ctc_sheet'],
                column_map_path
            )

            logging.info(f"Column mapping generation completed successfully")
            return {"column_map_path": column_map_path}

        elif module_id == "ipe_testing":
            validate_config(config, ['pay_registrar', 'pay_registrar_sheet', 'ctc_file', 'ctc_sheet'])

            column_map_path = os.path.join(output_dir, "column_map.json")
            if not os.path.exists(column_map_path):
                logging.info("Column map not found, generating it...")
                get_column.jugg(
                    config['pay_registrar'],
                    config['pay_registrar_sheet'],
                    config['ctc_file'],
                    config['ctc_sheet'],
                    column_map_path
                )

            ipe_custom_keys = config.get('ipe_custom_keys', [
                'Pernr', 'Employee Name', 'Design Code', 'MonthYear',
                'DOJ', 'DOL', 'PAN Number', 'Gross', 'Net Pay',
                'Ded Tot', 'PROV. FUND', 'E.S.I'
            ])

            ipe_testing.jugg(
                config['pay_registrar'],
                config['pay_registrar_sheet'],
                column_map_path,
                ipe_custom_keys
            )
            logging.info("IPE Testing completed successfully")

        elif module_id == "exception_testing":
            column_map_path = os.path.join(output_dir, "column_map.json")
            if not os.path.exists(column_map_path):
                get_column.jugg(
                    config['pay_registrar'],
                    config['pay_registrar_sheet'],
                    config['ctc_file'],
                    config['ctc_sheet'],
                    column_map_path
                )

            ex_ts_output_path = os.path.join(output_dir, "Exception Testing.xlsx")
            expn_no = config.get('expn_no', [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13])  # NEW
            exception_testing.jugg(
                config['pay_registrar'],
                ex_ts_output_path,
                column_map_path,
                config['pay_registrar_sheet'],
                expn_no
            )
            logging.info("Exception Testing completed successfully")

        elif module_id == "headcount_reconciliation":
            column_map_path = os.path.join(output_dir, "column_map.json")
            if not os.path.exists(column_map_path):
                get_column.jugg(
                    config['pay_registrar'],
                    config['pay_registrar_sheet'],
                    config['ctc_file'],
                    config['ctc_sheet'],
                    column_map_path
                )

            hc_output_path = os.path.join(output_dir, "Headcount Reconcilation.json")
            headcount_reco.jugg(
                column_map_path,
                config['add_list'],
                config['del_list'],
                config['ctc_file'],
                config['pay_registrar'],
                config.get('add_list_sheet', 'New joiners'),
                config.get('del_list_sheet', 'Resignees'),
                config['ctc_sheet'],
                config['pay_registrar_sheet'],
                config.get('opening_headcount', 2000),
                config.get('date_of_joining_column', 'Date of joining'),
                config.get('date_of_leaving_column', 'Leaving date'),
                hc_output_path
            )

        elif module_id == "mom_analysis":
            column_map_path = os.path.join(output_dir, "column_map.json")
            # Generate column map first if it doesn't exist
            if not os.path.exists(column_map_path):
                get_column.jugg(
                    config['pay_registrar'], 
                    config['pay_registrar_sheet'], 
                    config['ctc_file'], 
                    config['ctc_sheet'], 
                    column_map_path
                )
                
            mom_output_file = os.path.join(output_dir, "Mom Increment.xlsx")
            mom_analysis.jugg(
                config['pay_registrar'], 
                config['pay_registrar_sheet'], 
                column_map_path, 
                mom_output_file, 
                config.get('mom_display_cols', ['Pernr', 'Employee Name', 'DOJ', 'DOL']), 
                config.get('mom_calc_cols', ['BASIC', 'H R A']), 
                config.get('mom_increment_month', 'Nov-24')
            )
            
        elif module_id == "increment_analysis":
            mom_output_file = os.path.join(output_dir, "Mom Increment.xlsx")
            incr_output_path = os.path.join(output_dir, "Increment_Analysis.json")
            increment.jugg(
                config['ctc_file'], 
                config['ctc_sheet'], 
                config['ctc_py_file'], 
                config['ctc_py_sheet'], 
                mom_output_file, 
                config.get('increment_columns', ["Emp. No", "Emp. Name", "DOJ", "Department"]), 
                config.get('increment_cols_to_sum', ["Monthly CTC"]), 
                config.get('increment_reconciliation_input', 0), 
                incr_output_path
            )
            
        elif module_id == "pf_sal_analytics":
            hc_output_path = os.path.join(output_dir, "Headcount Reconcilation.json")
            incr_output_path = os.path.join(output_dir, "Increment_Analysis.json")
            pf_output_path = os.path.join(output_dir, "pf_calculations.json")
            salary_output_path = os.path.join(output_dir, "salary_calculations.json")
            
            risk_assessment = config.get('risk_assessment', 'Higher')
            control_reliance = config.get('control_reliance', 'Relying on controls')
            
            pf_sal_analytics.jugg(
                hc_output_path, 
                incr_output_path, 
                config.get('combined_json_path', ''), 
                config.get('i_input', [24, 62]), 
                config.get('ii_input', [25]), 
                risk_assessment, 
                control_reliance, 
                config.get('performance_materiality', 21600000), 
                int(config.get('percentage', 10)), 
                float(config.get('weighted_avg_headcount_py', 1601.06)), 
                config.get('exclude_input', []), 
                pf_output_path, 
                salary_output_path
            )
            
        elif module_id == "actuary_testing":
            acc_ts_output_path = os.path.join(output_dir, "actuary_testing.json")
            actuary_test.jugg(
                config['actuary_file'], 
                config['actuary_sheet'], 
                config['ctc_file'], 
                config['ctc_sheet'], 
                acc_ts_output_path
            )
            
        elif module_id == "accuracy_check":
            column_map_path = os.path.join(output_dir, "column_map.json")
            # Generate column map first if it doesn't exist
            if not os.path.exists(column_map_path):
                get_column.jugg(
                    config['pay_registrar'], 
                    config['pay_registrar_sheet'], 
                    config['ctc_file'], 
                    config['ctc_sheet'], 
                    column_map_path
                )
                
            acc_ck_output_file = os.path.join(output_dir, "CTC_Actuary.xlsx")
            accuracy_check.jugg(
                config['actuary_file'], 
                config['ctc_file'], 
                column_map_path, 
                acc_ck_output_file, 
                config['actuary_sheet'], 
                config['ctc_sheet']
            )
        
        else:
            raise ValueError(f"Unknown module_id: {module_id}")
            
    except Exception as e:
        logging.error(f"Error executing module {module_id}: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        raise



if __name__ == "__main__":
    try:
        logging.info("=== Payroll Module Execution Started ===")
        logging.info(f"Command line arguments: {sys.argv}")

        if len(sys.argv) != 3:
            error_msg = "Usage: python main.py <module_id> <config_json_path>"
            logging.error(error_msg)
            print(error_msg)
            sys.exit(1)

        module_id = sys.argv[1]
        config_path = sys.argv[2]

        config = load_config(config_path)
        result = run_module(module_id, config)

        if result:
            logging.info(f"Execution completed with result: {result}")
            print(json.dumps(result))
        else:
            logging.info("Execution completed successfully (no return value)")

        logging.info("=== Payroll Module Execution Completed Successfully ===")

    except Exception as e:
        error_msg = f"FATAL ERROR: {str(e)}"
        logging.error(error_msg)
        logging.error(f"Full traceback: {traceback.format_exc()}")
        print(error_msg, file=sys.stderr)
        sys.exit(1)
