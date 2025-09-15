import os
import json
import uuid
from azure.storage.blob import BlobServiceClient

# === CONFIG ===
CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=auditfirmone;AccountKey=noJNGotPPflseazBYfQ5zGTL3ulm7Eq1kxhwPNGXzl04celHpi9xjQsrXIYNTWhFzDsCnYuedKLs+AStDYspZg==;EndpointSuffix=core.windows.net"
MAPPING_FILE = "cloud_tree.json"  # where we keep your JSON mapping
CONTAINERS = ["juggernaut", "client", "tools", "recycle_bin"]

# === INIT AZURE CLIENT ===
blob_service_client = BlobServiceClient.from_connection_string(CONNECTION_STRING)


# === HELPER FUNCTIONS ===
def load_mapping():
    """Load JSON mapping file, create if not exists."""
    if not os.path.exists(MAPPING_FILE):
        return {c.capitalize(): [] for c in CONTAINERS}
    with open(MAPPING_FILE, "r") as f:
        return json.load(f)


def save_mapping(mapping):
    """Save mapping JSON."""
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=4)


def generate_unique_code():
    """Generate a unique UUID as code."""
    return str(uuid.uuid4())  # e.g. 'c9a64647-fb6c-47d9-86b2-2bb4239a7d63'


def upload_file(container, file_path, reference=""):
    """Upload file, assign UUID, update mapping JSON."""
    mapping = load_mapping()
    filename = os.path.basename(file_path)

    # generate new UUID code
    code = generate_unique_code()

    # upload file to azure with blob name = code
    blob_client = blob_service_client.get_blob_client(container=container, blob=code)
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)

    # update mapping
    entry = {"name": filename, "code": code, "reference": reference}
    mapping[container.capitalize()].append(entry)
    save_mapping(mapping)

    print(f"Uploaded {filename} as blob {code} in container {container}")
    return code


def download_file(container, filename, download_path):
    """Find file by name → lookup UUID → download from Azure."""
    mapping = load_mapping()

    # find entry
    entry = next((item for item in mapping[container.capitalize()] if item["name"] == filename), None)
    if not entry:
        raise ValueError(f"File {filename} not found in mapping under {container}")

    code = entry["code"]

    blob_client = blob_service_client.get_blob_client(container=container, blob=code)
    with open(download_path, "wb") as f:
        f.write(blob_client.download_blob().readall())

    print(f"Downloaded {filename} (blob {code}) from {container} → {download_path}")


# === DEMO USAGE ===
# Upload files
upload_file("client", r"C:\Users\shez8\Desktop\Juggernaut\Conclusions\Subsequent Events.docx", reference="Test")
# Container, Input path, Reference

# Download a file by clicking its "name"
download_file("client", "Subsequent Events.docx", "downloaded_ed.docx")
# Container, Name to fetch, Download path
