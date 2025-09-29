import sys
import json

# The core implementation is contained in exception_sharepoint_core.py in the same directory
# This runner loads args from stdin (JSON) or falls back to CLI for dev usage, then invokes jugg.


def main():
    # Prefer reading a single JSON line from stdin written by Electron with options
    payload = None
    try:
        data = sys.stdin.read().strip()
        if data:
            payload = json.loads(data)
    except Exception:
        payload = None

    pay_registrar = None
    expn_no = None

    if isinstance(payload, dict):
        pay_registrar = payload.get("pay_registrar")
        expn_no = payload.get("expn_no")

    # CLI fallback: execute_exception_sharepoint.py <pay_registrar> <expn_json>
    if (not pay_registrar or not expn_no) and len(sys.argv) >= 3:
        pay_registrar = sys.argv[1]
        try:
            expn_no = json.loads(sys.argv[2])
        except Exception:
            expn_no = [1,2,3,4,5,7,8,9,10,11,12,13]

    if not pay_registrar:
        print(json.dumps({"success": False, "error": "Missing pay_registrar"}))
        sys.exit(1)

    if not isinstance(expn_no, list) or not all(isinstance(x, int) for x in expn_no):
        print(json.dumps({"success": False, "error": "Invalid expn_no list"}))
        sys.exit(1)

    # Defer heavy import until after args are parsed
    from exception_sharepoint_core import jugg

    try:
        jugg(pay_registrar, expn_no)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

