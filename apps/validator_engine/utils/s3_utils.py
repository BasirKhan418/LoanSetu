import os
import uuid
import boto3
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")  # optional if using URL-only flow

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


def _make_temp_path(original_name: str) -> str:
    import tempfile
    temp_dir = os.path.join(tempfile.gettempdir(), "validation_engine")
    os.makedirs(temp_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}_{original_name}"
    return os.path.join(temp_dir, filename)


def download_from_s3_to_temp(file_key_or_url: str) -> str:
    """
    Unified downloader:

    - If file_key_or_url starts with http/https -> parse S3 bucket and key from URL, download via boto3.
    - Otherwise -> treat as S3 key in AWS_S3_BUCKET and download via boto3.

    Returns local file path. Caller is responsible for deleting it (using safe_remove).
    """

    # Case 1: full URL (S3 URL)
    if file_key_or_url.startswith("http://") or file_key_or_url.startswith("https://"):
        parsed = urlparse(file_key_or_url.split("?")[0])  # strip query
        original_name = os.path.basename(parsed.path) or "file"
        local_path = _make_temp_path(original_name)

        # Check if it's a presigned URL (has query parameters with AWS signature)
        if "?" in file_key_or_url and ("X-Amz-" in file_key_or_url or "AWSAccessKeyId" in file_key_or_url):
            # This is a presigned URL, use direct HTTP download
            resp = requests.get(file_key_or_url, stream=True, timeout=20)
            resp.raise_for_status()
            with open(local_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
        else:
            # This is a direct S3 URL, extract bucket and key and use boto3
            if "s3.amazonaws.com" in parsed.netloc or "s3." in parsed.netloc:
                # Extract bucket and key from URL
                if parsed.netloc.endswith(".s3.amazonaws.com") or parsed.netloc.endswith(".s3.ap-south-1.amazonaws.com"):
                    # Virtual-hosted-style URL: https://bucket.s3.region.amazonaws.com/key
                    bucket_name = parsed.netloc.split('.')[0]
                    key = parsed.path.lstrip('/')
                else:
                    # Path-style URL: https://s3.region.amazonaws.com/bucket/key
                    path_parts = parsed.path.strip('/').split('/', 1)
                    if len(path_parts) < 2:
                        raise ValueError(f"Invalid S3 URL format: {file_key_or_url}")
                    bucket_name = path_parts[0]
                    key = path_parts[1]
                
                # Use boto3 to download with credentials
                s3_client.download_file(bucket_name, key, local_path)
            else:
                # Not an S3 URL, try direct HTTP download
                resp = requests.get(file_key_or_url, stream=True, timeout=20)
                resp.raise_for_status()
                with open(local_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)

        return local_path

    # Case 2: plain S3 key (old behavior)
    if not AWS_S3_BUCKET:
        raise RuntimeError(
            "AWS_S3_BUCKET env not set and file_key is not a URL. "
            "Either pass full S3 URL or configure AWS_S3_BUCKET."
        )

    original_name = os.path.basename(file_key_or_url).replace("/", "_") or "file"
    local_path = _make_temp_path(original_name)

    try:
        print(f"[DEBUG] Attempting to download from S3: bucket={AWS_S3_BUCKET}, key={file_key_or_url}")
        s3_client.download_file(AWS_S3_BUCKET, file_key_or_url, local_path)
        return local_path
    except Exception as e:
        print(f"[ERROR] Failed to download from S3: bucket={AWS_S3_BUCKET}, key={file_key_or_url}, error={str(e)}")
        raise
