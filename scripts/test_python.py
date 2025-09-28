import sys
import json

if __name__ == "__main__":
    try:
        print("Python script is working!")
        print("Arguments:", sys.argv)
        
        if len(sys.argv) >= 3:
            config_path = sys.argv[2]
            print(f"Config file path: {config_path}")
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            print("Config loaded successfully:")
            print(json.dumps(config, indent=2))
            
            # Return a test result
            result = {
                "success": True, 
                "columns": ["Test Column 1", "Test Column 2", "Test Column 3"]
            }
            print(json.dumps(result))
        else:
            result = {"success": False, "error": "No config file provided."}
            print(json.dumps(result))
    except Exception as e:
        result = {"success": False, "error": f"Script error: {str(e)}"}
        print(json.dumps(result))
