import sys
import json

def main():
    payload = None
    try:
        data = sys.stdin.read().strip()
        if data:
            payload = json.loads(data)
    except Exception:
        payload = None

    add_list = del_list = ctc_file = pay_registrar = None
    opening_apr = None
    dojal = doldl = None

    if isinstance(payload, dict):
        add_list = payload.get("add_list")
        del_list = payload.get("del_list")
        ctc_file = payload.get("ctc_file")
        pay_registrar = payload.get("pay_registrar")
        opening_apr = payload.get("opening_apr")
        dojal = payload.get("dojal")
        doldl = payload.get("doldl")

    # CLI fallback
    if (not add_list or not del_list or not ctc_file or not pay_registrar) and len(sys.argv) >= 8:
        add_list = sys.argv[1]
        del_list = sys.argv[2]
        ctc_file = sys.argv[3]
        pay_registrar = sys.argv[4]
        opening_apr = int(sys.argv[5])
        dojal = sys.argv[6]
        doldl = sys.argv[7]

    if not all([add_list, del_list, ctc_file, pay_registrar, opening_apr, dojal, doldl]):
        print(json.dumps({"success": False, "error": "Missing required inputs"}))
        sys.exit(1)

    from headcount_sharepoint_core import jugg

    try:
        jugg(add_list, del_list, ctc_file, pay_registrar, "Execution_Payroll_HeadcountReconcilation.json", opening_apr, dojal, doldl)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()

