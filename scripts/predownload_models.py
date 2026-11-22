import sys
import os

print(f"Python: {sys.executable}")
print("1. Pre-downloading and caching rembg model 'isnet-general-use'...")

try:
    import rembg
    session = rembg.new_session('isnet-general-use')
    print("✓ rembg 'isnet-general-use' successfully loaded and cached!")
except Exception as e:
    print(f"✗ rembg loading failed: {e}")
    sys.exit(1)

print("\n2. Pre-downloading and caching open_clip 'ViT-B-32' with 'laion2b_s34b_b79k'...")
try:
    import open_clip
    import torch
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k', device='cpu')
    model.eval()
    tokenizer = open_clip.get_tokenizer('ViT-B-32')
    print("✓ open_clip ViT-B-32 (laion2b_s34b_b79k) successfully loaded and cached!")
except Exception as e:
    print(f"✗ open_clip loading failed: {e}")
    sys.exit(1)

print("\nAll models downloaded and ready for offline inference!")
