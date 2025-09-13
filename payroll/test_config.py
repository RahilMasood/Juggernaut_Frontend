#!/usr/bin/env python3
"""
Simple test script to validate configuration and environment setup
"""
import json
import sys
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def test_configuration():
    """Test configuration loading and validation"""
    print("=== Configuration Test ===")
    
    if len(sys.argv) < 2:
        print("Usage: python test_config.py <config_json_path>")
        sys.exit(1)
    
    config_path = sys.argv[1]
    print(f"Testing config file: {config_path}")
    
    # Test 1: Check if config file exists
    if not os.path.exists(config_path):
        print(f"❌ Config file not found: {config_path}")
        return False
    print(f"✅ Config file exists: {config_path}")
    
    # Test 2: Load and parse JSON
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        print(f"✅ Config file loaded successfully")
        print(f"📄 Config contents:\n{json.dumps(config, indent=2)}")
    except Exception as e:
        print(f"❌ Failed to load config: {e}")
        return False
    
    # Test 3: Check required directories
    output_dir = config.get('output_directory', 'Outputs')
    if not os.path.exists(output_dir):
        print(f"⚠️  Output directory doesn't exist, will create: {output_dir}")
        os.makedirs(output_dir, exist_ok=True)
        print(f"✅ Output directory created: {output_dir}")
    else:
        print(f"✅ Output directory exists: {output_dir}")
    
    # Test 4: Check file paths
    file_keys = ['pay_registrar', 'ctc_file', 'ctc_py_file', 'add_list', 'del_list', 'actuary_file', 'combined_json_path']
    for key in file_keys:
        if key in config and config[key]:
            file_path = config[key]
            if os.path.exists(file_path):
                print(f"✅ File exists: {key} -> {file_path}")
            else:
                print(f"❌ File not found: {key} -> {file_path}")
        else:
            print(f"⚪ Optional file not specified: {key}")
    
    # Test 5: Check Python modules availability
    print("\n=== Module Import Test ===")
    modules_to_test = [
        'get_column', 'ipe_testing', 'exception_testing', 
        'headcount_reco', 'mom_analysis', 'increment', 
        'pf_sal_analytics', 'actuary_test', 'accuracy_check'
    ]
    
    for module_name in modules_to_test:
        try:
            __import__(module_name)
            print(f"✅ Module import successful: {module_name}")
        except ImportError as e:
            print(f"❌ Module import failed: {module_name} - {e}")
        except Exception as e:
            print(f"⚠️  Module import error: {module_name} - {e}")
    
    print("\n=== Test Complete ===")
    return True

if __name__ == "__main__":
    test_configuration()
