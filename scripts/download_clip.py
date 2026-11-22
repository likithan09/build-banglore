import os
import sys
import time
import requests

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)
TARGET_FILE = os.path.join(MODEL_DIR, "open_clip_pytorch_model.bin")

URL = "https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K/resolve/main/open_clip_pytorch_model.bin"

if os.path.exists(TARGET_FILE) and os.path.getsize(TARGET_FILE) > 500_000_000:
    print(f"Model already downloaded: {TARGET_FILE} ({os.path.getsize(TARGET_FILE)} bytes)")
    sys.exit(0)

print(f"Downloading {URL} to {TARGET_FILE}...")
headers = {"User-Agent": "Mozilla/5.0"}

# Support resume
downloaded = 0
if os.path.exists(TARGET_FILE):
    downloaded = os.path.getsize(TARGET_FILE)
    if downloaded > 0:
        headers["Range"] = f"bytes={downloaded}-"
        print(f"Resuming from {downloaded / 1024 / 1024:.2f} MB")

mode = "ab" if downloaded > 0 else "wb"
resp = requests.get(URL, headers=headers, stream=True, timeout=30)
if resp.status_code not in (200, 206):
    print(f"Failed with status: {resp.status_code}")
    sys.exit(1)

total_length = resp.headers.get('content-length')
if total_length:
    total_size = int(total_length) + downloaded
else:
    total_size = 605219813

start_time = time.time()
chunk_size = 2 * 1024 * 1024  # 2MB chunks
current = downloaded
last_print = 0

with open(TARGET_FILE, mode) as f:
    for chunk in resp.iter_content(chunk_size=chunk_size):
        if chunk:
            f.write(chunk)
            current += len(chunk)
            now = time.time()
            if now - last_print > 1.0 or current >= total_size:
                pct = (current / total_size) * 100
                mb = current / 1024 / 1024
                elapsed = now - start_time
                speed = (current - downloaded) / (elapsed + 1e-5) / 1024 / 1024
                print(f"Progress: {mb:.1f} MB / {total_size / 1024 / 1024:.1f} MB ({pct:.1f}%) @ {speed:.2f} MB/s", flush=True)
                last_print = now

print(f"\nDownload complete: {TARGET_FILE} ({os.path.getsize(TARGET_FILE)} bytes)")
