import pandas as pd
import sys
import json

def list_sheets(file_path):
    try:
        excel_file = pd.ExcelFile(file_path)
        sheets = excel_file.sheet_names
        return {"ok": True, "sheets": sheets}
    except Exception as e:
        return {"ok": False, "error": str(e)}

def list_columns(file_path, sheet_name):
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name, nrows=0)
        columns = df.columns.tolist()
        return {"ok": True, "columns": columns}
    except Exception as e:
        return {"ok": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "error": "Missing arguments"}))
        sys.exit(1)
    
    command = sys.argv[1]
    file_path = sys.argv[2]
    
    if command == "sheets":
        result = list_sheets(file_path)
    elif command == "columns":
        if len(sys.argv) < 4:
            print(json.dumps({"ok": False, "error": "Missing sheet name"}))
            sys.exit(1)
        sheet_name = sys.argv[3]
        result = list_columns(file_path, sheet_name)
    else:
        result = {"ok": False, "error": "Unknown command"}
    
    print(json.dumps(result))

