import os
import numpy as np
import cv2

TEST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tests", "test_images")
os.makedirs(TEST_DIR, exist_ok=True)

# 1. Plain Background Image: Handcrafted wooden artifact on clean neutral background
img_plain = np.full((800, 800, 3), 235, dtype=np.uint8)
# Draw wooden craft object in center (rich warm wood colors #C07030)
cv2.ellipse(img_plain, (400, 480), (160, 120), 0, 0, 360, (50, 110, 190), -1)  # BGR warm wood
cv2.circle(img_plain, (400, 320), (90), (45, 100, 180), -1)
cv2.circle(img_plain, (370, 300), (16), (20, 40, 60), -1)  # Eye
cv2.rectangle(img_plain, (380, 560), (420, 640), (35, 80, 150), -1)  # Base
plain_path = os.path.join(TEST_DIR, "test_plain.jpg")
cv2.imwrite(plain_path, img_plain)
print("Created:", plain_path)

# 2. Cluttered Background Image: Same wooden craft but surrounded by workshop clutter
img_clutter = np.zeros((800, 800, 3), dtype=np.uint8)
# Workshop floor/table clutter (planks, grain, background tools)
for i in range(0, 800, 40):
    col = (int(80 + (i % 60)), int(110 + (i % 40)), int(140 + (i % 50)))
    cv2.line(img_clutter, (0, i), (800, i + 20), col, 25)
# Background tools and noise
noise = np.random.normal(0, 25, (800, 800, 3)).astype(np.int16)
img_clutter = np.clip(img_clutter.astype(np.int16) + noise, 0, 255).astype(np.uint8)
cv2.rectangle(img_clutter, (50, 600), (220, 750), (40, 50, 60), -1)  # Tool
cv2.circle(img_clutter, (680, 200), (70), (120, 100, 80), -1)  # Paint tin
# Main handcrafted product placed in foreground
cv2.ellipse(img_clutter, (400, 480), (160, 120), 0, 0, 360, (50, 110, 190), -1)
cv2.circle(img_clutter, (400, 320), (90), (45, 100, 180), -1)
cv2.circle(img_clutter, (370, 300), (16), (20, 40, 60), -1)
cv2.rectangle(img_clutter, (380, 560), (420, 640), (35, 80, 150), -1)
clutter_path = os.path.join(TEST_DIR, "test_cluttered.jpg")
cv2.imwrite(clutter_path, img_clutter)
print("Created:", clutter_path)

# 3. Small Product / Bad Crop Image: Product covers only 0.7% of image area (<2%)
img_small = np.full((1000, 1000, 3), 220, dtype=np.uint8)
# Tiny 40x40 pixel bead in corner = 1600 / 1,000,000 = 0.16% coverage
cv2.circle(img_small, (200, 200), 25, (40, 80, 180), -1)
small_path = os.path.join(TEST_DIR, "test_small.jpg")
cv2.imwrite(small_path, img_small)
print("Created:", small_path)

# 4. Corrupt / Unreadable Image File
corrupt_path = os.path.join(TEST_DIR, "test_corrupt.jpg")
with open(corrupt_path, "wb") as f:
    f.write(b"CORRUPT_NOT_AN_IMAGE_FILE_KALASETU_TEST_PADDING_1234567890\x00\xff\xfe\x00")
print("Created:", corrupt_path)
