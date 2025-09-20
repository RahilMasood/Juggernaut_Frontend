import pandas as pd
import json
import io
import sys
import os
from azure.storage.blob import BlobServiceClient

# === CONFIG ===
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=auditfirmone;AccountKey=noJNGotPPflseazBYfQ5zGTL3ulm7Eq1kxhwPNGXzl04celHpi9xjQsrXIYNTWhFzDsCnYuedKLs+AStDYspZg==;EndpointSuffix=core.windows.net"
CLIENT_CONTAINER = "client"
OUTPUT_CONTAINER = "juggernaut"
OUTPUT_BLOB_NAME = "Execution_Payroll_PRColumnMap.json"

def get_blob_service():
    """Get Azure Blob Service Client"""
    return BlobServiceClient.from_connection_string(CONNECTION_STRING)

def create_column_map(blob_name: str, local_file_path: str):
    """Create column map from Pay Registrar file and upload to Azure"""
    try:
        blob_service = get_blob_service()

        # 1. Read the local file that was downloaded
        df_pr = pd.read_excel(local_file_path, nrows=0)

        # 2. Build JSON structure
        output_data = {
            "column_map": {},
            "column_names": df_pr.columns.tolist()
        }

        # 3. Upload JSON to juggernaut container
        output_blob = blob_service.get_blob_client(OUTPUT_CONTAINER, OUTPUT_BLOB_NAME)
        output_blob.upload_blob(json.dumps(output_data, indent=4), overwrite=True)

        print(f"✅ Successfully created and uploaded {OUTPUT_BLOB_NAME}")
        print(f"📊 Found {len(df_pr.columns)} columns in the file")
        print(f"📋 Column names: {df_pr.columns.tolist()}")
        
        return True

    except Exception as e:
        print(f"❌ Error creating column map: {str(e)}")
        return False

def main():
    """Main function to process Pay Registrar file"""
    try:
        # Get command line arguments
        if len(sys.argv) < 2:
            print("❌ Error: No input file provided")
            return False

        input_file = sys.argv[1]
        blob_name = sys.argv[2] if len(sys.argv) > 2 else os.path.basename(input_file)

        print(f"🔄 Processing Pay Registrar file: {blob_name}")
        print(f"📁 Local file path: {input_file}")

        # Check if file exists
        if not os.path.exists(input_file):
            print(f"❌ Error: File not found: {input_file}")
            return False

        # Process the file
        success = create_column_map(blob_name, input_file)
        
        if success:
            print("✅ Pay Registrar processing completed successfully")
            return True
        else:
            print("❌ Pay Registrar processing failed")
            return False

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
