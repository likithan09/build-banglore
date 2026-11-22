"""
KALASETU Image Enhancement & Branded Cataloguing Pipeline
---------------------------------------------------------
Automates product detection, background removal, category recognition,
color-safe lightness calibration, and branded e-commerce compositing.

Commercial Licences:
- rembg 'isnet-general-use': Apache-2.0
- open_clip ViT-B-32 ('laion2b_s34b_b79k'): MIT License
- OpenCV, Pillow, NumPy: BSD / Apache-2.0 / HPND
"""

import os
import io
import time
import base64
import threading
from typing import Dict, Any, Optional, Tuple, List, Union

import numpy as np
import cv2
from PIL import Image, ImageOps

# Limit image size to 40 million pixels to protect memory
Image.MAX_IMAGE_PIXELS = 40_000_000

# Brand Identity Constraints
BRAND_NAME = "KALASETU"
BRAND_PRIMARY_COLOUR = (138, 43, 43)   # #8A2B2B (RGB)
BRAND_ACCENT_COLOUR = (244, 163, 64)   # #F4A340 (RGB)
LOGO_FILE = None
WATERMARK = True

# Category to Default Style Mapping
CATEGORY_MAP = {
    "jewelry": "dark_luxe",
    "apparel": "soft_studio",
    "footwear": "soft_studio",
    "bags": "soft_studio",
    "furniture": "soft_studio",
    "kitchenware": "soft_studio",
    "textile": "soft_studio",
    "electronics": "cool_tech",
    "home_decor": "warm_craft",
    "handicraft": "warm_craft",
    "pottery": "warm_craft",
    "cosmetics": "pastel",
    "food": "warm_surface",
    "toys": "white",
    "stationery": "white",
}

CATEGORIES = list(CATEGORY_MAP.keys())

# Thread-safe singletons for AI models
_rembg_session = None
_rembg_lock = threading.Lock()

_clip_model = None
_clip_preprocess = None
_clip_tokenizer = None
_clip_lock = threading.Lock()


def get_rembg_session():
    """Returns cached, thread-safe rembg session using isnet-general-use."""
    global _rembg_session
    if _rembg_session is None:
        with _rembg_lock:
            if _rembg_session is None:
                import rembg
                _rembg_session = rembg.new_session("isnet-general-use")
    return _rembg_session


def get_clip_components():
    """Returns cached OpenCLIP model, transform, and tokenizer."""
    global _clip_model, _clip_preprocess, _clip_tokenizer
    if _clip_model is None:
        with _clip_lock:
            if _clip_model is None:
                import open_clip
                import torch

                # Look for local weights first
                local_weights = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)), "models", "open_clip_pytorch_model.bin"
                )
                if os.path.exists(local_weights) and os.path.getsize(local_weights) > 500_000_000:
                    model, _, preprocess = open_clip.create_model_and_transforms(
                        "ViT-B-32", pretrained=local_weights, device="cpu"
                    )
                else:
                    # Fallback to standard pretrained identifier
                    model, _, preprocess = open_clip.create_model_and_transforms(
                        "ViT-B-32", pretrained="laion2b_s34b_b79k", device="cpu"
                    )
                model.eval()
                tokenizer = open_clip.get_tokenizer("ViT-B-32")
                _clip_model = model
                _clip_preprocess = preprocess
                _clip_tokenizer = tokenizer
    return _clip_model, _clip_preprocess, _clip_tokenizer


# ------------------------------------------------------------------------------
# STEP A: LOAD & NORMALIZE
# ------------------------------------------------------------------------------
def load_and_normalize_image(src: Union[str, bytes, Image.Image]) -> Tuple[np.ndarray, Optional[np.ndarray], List[str]]:
    """
    Loads image safely:
    - 40M pixel limit
    - EXIF transposition
    - sRGB conversion
    - Downscaled to max 2400px on long side
    - Detects pre-existing PNG alpha transparency
    Returns (rgb_array, existing_alpha_mask, warnings).
    """
    warnings = []
    pil_img = None

    if isinstance(src, Image.Image):
        pil_img = src
    elif isinstance(src, bytes):
        pil_img = Image.open(io.BytesIO(src))
    elif isinstance(src, str):
        if src.startswith("data:image"):
            # Base64 string
            header, b64data = src.split(",", 1)
            raw = base64.b64decode(b64data)
            pil_img = Image.open(io.BytesIO(raw))
        elif src.startswith("http://") or src.startswith("https://"):
            import requests
            resp = requests.get(src, timeout=15)
            pil_img = Image.open(io.BytesIO(resp.content))
        else:
            # File path
            pil_img = Image.open(src)
    else:
        raise ValueError(f"Unsupported image input type: {type(src)}")

    # Fix EXIF orientation
    pil_img = ImageOps.exif_transpose(pil_img)

    # Check for real alpha channel
    existing_alpha = None
    if pil_img.mode in ("RGBA", "LA") or (pil_img.mode == "P" and "transparency" in pil_img.info):
        rgba = pil_img.convert("RGBA")
        a_channel = np.array(rgba.split()[-1])
        if np.min(a_channel) < 250:
            existing_alpha = a_channel

    # Convert to sRGB
    rgb_img = pil_img.convert("RGB")

    # Downscale if long side > 2400
    w, h = rgb_img.size
    long_side = max(w, h)
    if long_side > 2400:
        ratio = 2400.0 / long_side
        new_w = int(round(w * ratio))
        new_h = int(round(h * ratio))
        rgb_img = rgb_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        if existing_alpha is not None:
            a_pil = Image.fromarray(existing_alpha).resize((new_w, new_h), Image.Resampling.BILINEAR)
            existing_alpha = np.array(a_pil)

    rgb_array = np.array(rgb_img)
    return rgb_array, existing_alpha, warnings


# ------------------------------------------------------------------------------
# STEP B: CUTOUT (rembg isnet-general-use + Guided Filter + Cleanup)
# ------------------------------------------------------------------------------
def guided_filter_alpha(guide_gray: np.ndarray, alpha: np.ndarray, radius: int = 4, eps: float = 1e-3) -> np.ndarray:
    """Fast, robust He et al. Guided Filter implementation in pure OpenCV/NumPy."""
    guide = guide_gray.astype(np.float32) / 255.0
    p = alpha.astype(np.float32) / 255.0

    ksize = (radius * 2 + 1, radius * 2 + 1)
    mean_I = cv2.boxFilter(guide, cv2.CV_32F, ksize)
    mean_p = cv2.boxFilter(p, cv2.CV_32F, ksize)
    mean_Ip = cv2.boxFilter(guide * p, cv2.CV_32F, ksize)
    cov_Ip = mean_Ip - mean_I * mean_p

    mean_II = cv2.boxFilter(guide * guide, cv2.CV_32F, ksize)
    var_I = mean_II - mean_I * mean_I

    a = cov_Ip / (var_I + eps)
    b = mean_p - a * mean_I

    mean_a = cv2.boxFilter(a, cv2.CV_32F, ksize)
    mean_b = cv2.boxFilter(b, cv2.CV_32F, ksize)

    q = mean_a * guide + mean_b
    q = np.clip(q * 255.0, 0, 255).astype(np.uint8)
    return q


def extract_cutout_mask(rgb_array: np.ndarray, existing_alpha: Optional[np.ndarray] = None) -> np.ndarray:
    """
    Predicts product cutout mask using rembg 'isnet-general-use'.
    Refines edge transitions using guided filter in soft edge band.
    Removes disconnected specks (<5% of main object).
    """
    h, w = rgb_array.shape[:2]

    if existing_alpha is not None and np.sum(existing_alpha > 128) > 0.02 * (w * h):
        raw_mask = existing_alpha.copy()
    else:
        import rembg
        session = get_rembg_session()

        # Downscale to ~1280px for fast, stable prediction
        long_side = max(w, h)
        if long_side > 1280:
            scale = 1280.0 / long_side
            nw, nh = int(round(w * scale)), int(round(h * scale))
            rgb_small = cv2.resize(rgb_array, (nw, nh), interpolation=cv2.INTER_AREA)
        else:
            rgb_small = rgb_array

        pil_small = Image.fromarray(rgb_small)
        mask_pil = rembg.remove(pil_small, session=session, only_mask=True)
        raw_mask_small = np.array(mask_pil)

        # Scale mask back to full image resolution
        if long_side > 1280:
            raw_mask = cv2.resize(raw_mask_small, (w, h), interpolation=cv2.INTER_LINEAR)
        else:
            raw_mask = raw_mask_small

    # Refine soft edge band using Guided Filter
    gray_guide = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2GRAY)
    soft_band = (raw_mask > 10) & (raw_mask < 245)

    if np.any(soft_band):
        refined = guided_filter_alpha(gray_guide, raw_mask, radius=4, eps=1e-3)
        # Apply guided refinement specifically to the soft transition band
        final_mask = np.where(soft_band, refined, raw_mask)
    else:
        final_mask = raw_mask.copy()

    # Connected Components Cleanup:
    # Keep the largest object and any piece >= 5% of largest component
    bin_mask = (final_mask > 128).astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(bin_mask, connectivity=8)

    if num_labels > 2:
        # Label 0 is background; look at labels 1..num_labels-1
        areas = stats[1:, cv2.CC_STAT_AREA]
        max_area = np.max(areas)
        min_keep_area = 0.05 * max_area

        keep_mask = np.zeros_like(final_mask, dtype=bool)
        for label_idx, area in enumerate(areas, start=1):
            if area >= min_keep_area:
                keep_mask |= (labels == label_idx)

        # Zero out rejected noise specks
        final_mask = np.where(keep_mask, final_mask, 0)

    return final_mask


# ------------------------------------------------------------------------------
# STEP C: QUALITY CHECKS
# ------------------------------------------------------------------------------
def evaluate_quality(mask: np.ndarray, shape: Tuple[int, int]) -> Tuple[bool, List[str], float]:
    """
    Verifies product coverage and edge boundaries.
    Coverage < 2% or > 97% -> returns (False, warnings, coverage).
    Touches 3+ edges -> adds warning but returns True.
    """
    h, w = shape[:2]
    total_pixels = h * w
    prod_pixels = int(np.sum(mask > 128))
    coverage = prod_pixels / float(total_pixels)
    warnings = []

    if coverage < 0.02:
        warnings.append(
            f"Product covers under 2% of photo ({coverage*100:.1f}%). Subject may be too small or missing."
        )
        return False, warnings, coverage

    if coverage > 0.97:
        warnings.append(
            f"Product covers over 97% of photo ({coverage*100:.1f}%). Background isolation not possible."
        )
        return False, warnings, coverage

    # Edge touch check
    ys, xs = np.where(mask > 128)
    if len(xs) > 0:
        min_x, max_x = int(xs.min()), int(xs.max())
        min_y, max_y = int(ys.min()), int(ys.max())
        edges_touched = 0
        if min_x <= 1: edges_touched += 1
        if max_x >= w - 2: edges_touched += 1
        if min_y <= 1: edges_touched += 1
        if max_y >= h - 2: edges_touched += 1

        if edges_touched >= 3:
            warnings.append(
                f"Product touches {edges_touched} image edges. Subject may be cropped at camera borders."
            )

    return True, warnings, coverage


# ------------------------------------------------------------------------------
# STEP D: CATEGORY CLASSIFICATION (open_clip ViT-B-32 zero-shot)
# ------------------------------------------------------------------------------
def classify_category(rgb_array: np.ndarray, mask: np.ndarray) -> Tuple[str, float, List[Dict[str, Any]], str, List[str]]:
    """
    Classifies product category via zero-shot OpenCLIP on cutout placed on pure white.
    Returns (top_category, confidence, top3_list, recommended_style, warnings).
    """
    warnings = []
    try:
        import torch

        model, preprocess, tokenizer = get_clip_components()

        # Place cutout on pure white background
        h, w = rgb_array.shape[:2]
        alpha = (mask.astype(np.float32) / 255.0)[..., None]
        on_white = (rgb_array * alpha + 255.0 * (1.0 - alpha)).astype(np.uint8)

        # Crop to product bounding box with 10% margin
        ys, xs = np.where(mask > 128)
        if len(xs) > 0:
            min_x, max_x = max(0, xs.min()), min(w, xs.max() + 1)
            min_y, max_y = max(0, ys.min()), min(h, ys.max() + 1)
            crop = on_white[min_y:max_y, min_x:max_x]
        else:
            crop = on_white

        pil_crop = Image.fromarray(crop)
        image_input = preprocess(pil_crop).unsqueeze(0)

        # Zero-shot prompts for categories
        prompts = [
            f"a studio photograph of handcrafted {cat} artisan product" for cat in CATEGORIES
        ]
        text_tokens = tokenizer(prompts)

        with torch.no_grad():
            image_features = model.encode_image(image_input)
            text_features = model.encode_text(text_tokens)

            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)[0]
            scores = similarity.cpu().numpy()

        sorted_indices = np.argsort(scores)[::-1]
        top3 = []
        for idx in sorted_indices[:3]:
            top3.append({
                "category": CATEGORIES[idx],
                "confidence": round(float(scores[idx]), 3)
            })

        top_cat = top3[0]["category"]
        top_conf = top3[0]["confidence"]

        if top_conf < 0.30:
            warnings.append(
                f"Category detection uncertain (confidence: {top_conf:.2f}). Please confirm category."
            )
            rec_style = "soft_studio"
        else:
            rec_style = CATEGORY_MAP.get(top_cat, "soft_studio")

        return top_cat, top_conf, top3, rec_style, warnings

    except Exception as e:
        warnings.append(f"OpenCLIP classification note: {e}. Defaulting to handicraft.")
        return "handicraft", 0.35, [{"category": "handicraft", "confidence": 0.35}], "warm_craft", warnings


# ------------------------------------------------------------------------------
# STEP E: COLOR-SAFE ENHANCEMENT (LAB Lightness Channel Only)
# ------------------------------------------------------------------------------
def enhance_product_pixels(rgb_array: np.ndarray, mask: np.ndarray, strength: float = 0.8) -> np.ndarray:
    """
    Enhances ONLY the LAB lightness (L) channel:
    - Exposure correction if product is too dark (<80) or too bright (>210)
    - Mild CLAHE (clip 1.6, blended 30% with original L)
    - Hue and saturation (A and B channels) are 100% UNTOUCHED
    - If strength == 0.0, returns exact original RGB pixels
    """
    if strength <= 0.0:
        return rgb_array.copy()

    prod_mask = mask > 128
    if not np.any(prod_mask):
        return rgb_array.copy()

    lab = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2LAB)
    L, A, B = cv2.split(lab)

    L_prod = L[prod_mask]
    mean_l = float(np.mean(L_prod))

    L_float = L.astype(np.float32)

    # 1. Exposure normalization
    if mean_l < 80.0:
        lift = (80.0 - mean_l) * 0.40 * strength
        L_float[prod_mask] = np.clip(L_float[prod_mask] + lift, 0.0, 255.0)
    elif mean_l > 210.0:
        drop = (mean_l - 210.0) * 0.40 * strength
        L_float[prod_mask] = np.clip(L_float[prod_mask] - drop, 0.0, 255.0)

    # 2. Mild CLAHE on L channel
    clahe = cv2.createCLAHE(clipLimit=1.6 * strength, tileGridSize=(8, 8))
    clahe_out = clahe.apply(np.clip(L_float, 0, 255).astype(np.uint8)).astype(np.float32)

    # Blend 30% CLAHE with L
    L_enhanced = cv2.addWeighted(clahe_out, 0.30 * strength, L_float, 1.0 - (0.30 * strength), 0)
    L_enhanced_uint8 = np.clip(L_enhanced, 0, 255).astype(np.uint8)

    # Apply L change only to the product mask
    L_final = np.where(prod_mask, L_enhanced_uint8, L)

    # Recombine with original A and B channels (Hue/Saturation 100% preserved)
    enhanced_lab = cv2.merge([L_final, A, B])
    enhanced_rgb = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

    return enhanced_rgb


# ------------------------------------------------------------------------------
# STEP F & G: BACKGROUND GENERATION & BRAND TINT
# ------------------------------------------------------------------------------
def generate_procedural_background(style: str, size: int = 1600) -> np.ndarray:
    """
    Generates procedural background (wall, floor, radial light, vignette, anti-banding noise)
    tinted with KALASETU brand colors (#8A2B2B and #F4A340).
    Pure white is kept 100% pure white (255, 255, 255) for e-commerce marketplaces.
    """
    if style == "white":
        return np.full((size, size, 3), 255, dtype=np.uint8)

    # Base canvas coordinates
    y_coords, x_coords = np.mgrid[0:size, 0:size]
    norm_y = y_coords / float(size)
    norm_x = x_coords / float(size)

    floor_ratio = 0.72
    is_wall = norm_y < floor_ratio

    bg = np.zeros((size, size, 3), dtype=np.float32)

    if style == "soft_studio":
        # Neutral studio wall + floor
        wall_top = np.array([245, 245, 243], dtype=np.float32)
        wall_bot = np.array([233, 233, 230], dtype=np.float32)
        floor_top = np.array([226, 226, 223], dtype=np.float32)
        floor_bot = np.array([214, 214, 210], dtype=np.float32)

        # Brand tint (subtle 6% warm brand touch)
        brand_tint = (np.array(BRAND_ACCENT_COLOUR, dtype=np.float32) * 0.06)

        wall_grad = (1.0 - norm_y / floor_ratio)[..., None]
        bg[is_wall] = (wall_bot + (wall_top - wall_bot) * wall_grad)[is_wall] + brand_tint

        floor_grad = ((norm_y - floor_ratio) / (1.0 - floor_ratio))[..., None]
        bg[~is_wall] = (floor_top + (floor_bot - floor_top) * floor_grad)[~is_wall] + (brand_tint * 0.5)

    elif style == "warm_craft":
        # Earthy terracotta and warm ochre tones
        wall_top = np.array([250, 243, 235], dtype=np.float32)
        wall_bot = np.array([240, 228, 215], dtype=np.float32)
        floor_top = np.array([230, 215, 198], dtype=np.float32)
        floor_bot = np.array([218, 200, 182], dtype=np.float32)

        warm_tint = (np.array(BRAND_PRIMARY_COLOUR, dtype=np.float32) * 0.05 +
                     np.array(BRAND_ACCENT_COLOUR, dtype=np.float32) * 0.05)

        wall_grad = (1.0 - norm_y / floor_ratio)[..., None]
        bg[is_wall] = (wall_bot + (wall_top - wall_bot) * wall_grad)[is_wall] + warm_tint

        floor_grad = ((norm_y - floor_ratio) / (1.0 - floor_ratio))[..., None]
        bg[~is_wall] = (floor_top + (floor_bot - floor_top) * floor_grad)[~is_wall] + (warm_tint * 0.8)

    elif style == "dark_luxe":
        # Deep charcoal luxury with subtle gold reflection
        wall_top = np.array([20, 19, 22], dtype=np.float32)
        wall_bot = np.array([32, 30, 34], dtype=np.float32)
        floor_top = np.array([22, 21, 24], dtype=np.float32)
        floor_bot = np.array([14, 13, 16], dtype=np.float32)

        wall_grad = (norm_y / floor_ratio)[..., None]
        bg[is_wall] = (wall_top + (wall_bot - wall_top) * wall_grad)[is_wall]

        floor_grad = ((norm_y - floor_ratio) / (1.0 - floor_ratio))[..., None]
        bg[~is_wall] = (floor_top + (floor_bot - floor_top) * floor_grad)[~is_wall]

    elif style == "cool_tech":
        # Cool slate / navy gradient
        wall_top = np.array([36, 42, 54], dtype=np.float32)
        wall_bot = np.array([52, 62, 78], dtype=np.float32)
        floor_top = np.array([40, 48, 62], dtype=np.float32)
        floor_bot = np.array([28, 34, 46], dtype=np.float32)

        wall_grad = (norm_y / floor_ratio)[..., None]
        bg[is_wall] = (wall_top + (wall_bot - wall_top) * wall_grad)[is_wall]

        floor_grad = ((norm_y - floor_ratio) / (1.0 - floor_ratio))[..., None]
        bg[~is_wall] = (floor_top + (floor_bot - floor_top) * floor_grad)[~is_wall]

    elif style == "pastel":
        # Soft peach / cream pastel
        wall_top = np.array([253, 248, 244], dtype=np.float32)
        wall_bot = np.array([248, 238, 232], dtype=np.float32)
        floor_top = np.array([242, 230, 224], dtype=np.float32)
        floor_bot = np.array([232, 220, 214], dtype=np.float32)

        wall_grad = (1.0 - norm_y / floor_ratio)[..., None]
        bg[is_wall] = (wall_bot + (wall_top - wall_bot) * wall_grad)[is_wall]

        floor_grad = ((norm_y - floor_ratio) / (1.0 - floor_ratio))[..., None]
        bg[~is_wall] = (floor_top + (floor_bot - floor_top) * floor_grad)[~is_wall]

    elif style == "warm_surface":
        # Warm wood surface and soft wall
        wall_top = np.array([244, 240, 234], dtype=np.float32)
        wall_bot = np.array([236, 230, 220], dtype=np.float32)
        floor_top = np.array([186, 148, 114], dtype=np.float32)
        floor_bot = np.array([164, 126, 92], dtype=np.float32)

        wall_grad = (1.0 - norm_y / floor_ratio)[..., None]
        bg[is_wall] = (wall_bot + (wall_top - wall_bot) * wall_grad)[is_wall]

        floor_grad = ((norm_y - floor_ratio) / (1.0 - floor_ratio))[..., None]
        bg[~is_wall] = (floor_top + (floor_bot - floor_top) * floor_grad)[~is_wall]

    else:
        # Default soft studio
        return generate_procedural_background("soft_studio", size)

    # Add soft radial spotlight in upper center
    center_x, center_y = 0.5, 0.45
    radius = np.sqrt((norm_x - center_x) ** 2 + (norm_y - center_y) ** 2)
    radial_light = np.clip(1.0 - (radius / 0.75), 0.0, 1.0)
    radial_boost = (radial_light ** 1.8) * 14.0
    bg = bg + radial_boost[..., None]

    # Add subtle vignette towards outer corners
    vignette = np.clip(1.0 - ((radius / 1.1) ** 2.2) * 0.18, 0.75, 1.0)
    bg = bg * vignette[..., None]

    # Tiny anti-banding noise (sigma = 0.7)
    noise = np.random.normal(0.0, 0.7, (size, size, 3)).astype(np.float32)
    bg = np.clip(bg + noise, 0.0, 255.0).astype(np.uint8)

    # Brand Watermark (Bottom corner tag, never over product)
    if WATERMARK:
        draw_watermark(bg)

    return bg


def draw_watermark(bg: np.ndarray):
    """Draws subtle KALASETU brand mark in bottom right corner."""
    h, w = bg.shape[:2]
    text = BRAND_NAME
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.7
    thickness = 1

    (tw, th), baseline = cv2.getTextSize(text, font, font_scale, thickness)
    x = w - tw - 36
    y = h - 28

    # Check luminance of background at watermark area to ensure legible contrast
    region = bg[y - th - 8:y + baseline + 8, x - 12:x + tw + 12]
    mean_lum = float(np.mean(region)) if region.size > 0 else 128.0

    color = (255, 255, 255) if mean_lum < 110 else (90, 80, 75)
    overlay = bg.copy()
    cv2.putText(overlay, text, (x, y), font, font_scale, color, thickness, cv2.LINE_AA)
    # 40% blend
    cv2.addWeighted(overlay, 0.40, bg, 0.60, 0, bg)


# ------------------------------------------------------------------------------
# STEP H: COMPOSITE (Product Scaling, Contact Shadow, Reflection)
# ------------------------------------------------------------------------------
def composite_product(
    enhanced_rgb: np.ndarray,
    mask: np.ndarray,
    background: np.ndarray,
    style: str,
    size: int = 1600
) -> np.ndarray:
    """
    Composites enhanced product onto generated background:
    - Scales product to max ~78% width and ~70% height (never upscale > 1.5x)
    - Realistic contact shadow under product base
    - Surface reflection for 'dark_luxe' and 'cool_tech'
    """
    canvas = background.copy()
    h, w = canvas.shape[:2]

    # Find product bounding box
    ys, xs = np.where(mask > 128)
    if len(xs) == 0:
        return canvas

    x1, x2 = max(0, xs.min()), min(enhanced_rgb.shape[1], xs.max() + 1)
    y1, y2 = max(0, ys.min()), min(enhanced_rgb.shape[0], ys.max() + 1)

    crop_rgb = enhanced_rgb[y1:y2, x1:x2]
    crop_mask = mask[y1:y2, x1:x2]

    pw, ph = crop_rgb.shape[1], crop_rgb.shape[0]

    # Target constraints
    max_w = int(w * 0.78)
    max_h = int(h * 0.70)

    scale_w = max_w / float(pw)
    scale_h = max_h / float(ph)
    scale = min(scale_w, scale_h)

    # HARD RULE: Never upscale more than 1.5x of original product resolution
    scale = min(scale, 1.50)

    nw = max(10, int(round(pw * scale)))
    nh = max(10, int(round(ph * scale)))

    scaled_rgb = cv2.resize(crop_rgb, (nw, nh), interpolation=cv2.INTER_LANCZOS4)
    scaled_mask = cv2.resize(crop_mask, (nw, nh), interpolation=cv2.INTER_LANCZOS4)

    # Light sharpening on product after resizing
    unsharp = cv2.GaussianBlur(scaled_rgb, (0, 0), 1.2)
    scaled_rgb = cv2.addWeighted(scaled_rgb, 1.25, unsharp, -0.25, 0)

    # Vertical alignment: place product on floor horizon (~73% from top)
    floor_y = int(h * 0.73)
    pos_x = (w - nw) // 2
    pos_y = floor_y - nh + int(nh * 0.04)   # Slight overlap onto ground
    pos_y = max(int(h * 0.08), min(pos_y, h - nh - int(h * 0.06)))

    # 1. Subtle surface reflection for dark_luxe and cool_tech
    if style in ("dark_luxe", "cool_tech"):
        refl_height = int(nh * 0.22)
        if refl_height > 10:
            refl_slice_rgb = scaled_rgb[nh - refl_height:, :]
            refl_slice_mask = scaled_mask[nh - refl_height:, :]

            flipped_refl_rgb = cv2.flip(refl_slice_rgb, 0)
            flipped_refl_mask = cv2.flip(refl_slice_mask, 0)

            # Linear gradient fade from 0.25 to 0.0
            fade = np.linspace(0.25, 0.0, refl_height, dtype=np.float32)[:, None]
            refl_alpha = (flipped_refl_mask.astype(np.float32) / 255.0) * fade

            ry1 = pos_y + nh
            ry2 = min(h, ry1 + refl_height)
            actual_refl_h = ry2 - ry1

            if actual_refl_h > 0 and pos_x + nw <= w:
                refl_patch = canvas[ry1:ry2, pos_x:pos_x + nw]
                refl_a = refl_alpha[:actual_refl_h, :, None]
                refl_fg = flipped_refl_rgb[:actual_refl_h, :]
                canvas[ry1:ry2, pos_x:pos_x + nw] = (
                    refl_patch * (1.0 - refl_a) + refl_fg * refl_a
                ).astype(np.uint8)

    # 2. Contact shadow on floor
    shadow_w = int(nw * 0.90)
    shadow_h = max(14, int(nh * 0.09))
    shadow_canvas = np.zeros((h, w), dtype=np.float32)

    cx = pos_x + nw // 2
    cy = pos_y + nh - int(shadow_h * 0.2)

    cv2.ellipse(
        shadow_canvas,
        (cx, cy),
        (shadow_w // 2, shadow_h // 2),
        0, 0, 360,
        1.0, -1
    )
    # Heavy Gaussian blur to soften shadow edges
    ksize = int(shadow_h * 1.5) | 1
    shadow_blurred = cv2.GaussianBlur(shadow_canvas, (ksize, ksize), 0)

    # Intensity depending on style
    shadow_strength = 0.55 if style != "dark_luxe" else 0.35
    shadow_factor = 1.0 - (shadow_blurred * shadow_strength)[..., None]
    canvas = np.clip(canvas.astype(np.float32) * shadow_factor, 0, 255).astype(np.uint8)

    # 3. Composite product onto canvas using smooth alpha blending
    alpha = (scaled_mask.astype(np.float32) / 255.0)[..., None]

    y_end = pos_y + nh
    x_end = pos_x + nw

    target_slice = canvas[pos_y:y_end, pos_x:x_end].astype(np.float32)
    blended = target_slice * (1.0 - alpha) + scaled_rgb.astype(np.float32) * alpha
    canvas[pos_y:y_end, pos_x:x_end] = np.clip(blended, 0, 255).astype(np.uint8)

    return canvas


# ------------------------------------------------------------------------------
# STEP 3: MAIN FUNCTION - ANALYSE AND ENHANCE
# ------------------------------------------------------------------------------
def analyse_and_enhance(
    src: Union[str, bytes, Image.Image],
    style: Optional[str] = None,
    strength: float = 0.8,
    size: int = 1600
) -> Dict[str, Any]:
    """
    Main function:
    1. Safe load & normalize
    2. Cutout via rembg 'isnet-general-use' with guided edge refinement
    3. Quality checks (coverage, borders)
    4. Category classification via zero-shot OpenCLIP (ViT-B-32)
    5. Color-safe LAB lightness calibration
    6. Branded procedural background generation
    7. Natural shadow + product composite

    Returns dict with styled_jpeg, white_jpeg, cutout_png, category, confidence,
    top3, style, steps, warnings, ok, and timings.
    """
    timings: Dict[str, float] = {}
    steps: List[str] = []
    warnings: List[str] = []
    total_start = time.time()

    # Step A: Load
    t0 = time.time()
    try:
        rgb_array, existing_alpha, load_warns = load_and_normalize_image(src)
        warnings.extend(load_warns)
    except Exception as e:
        return {
            "ok": False,
            "error": f"Failed to read image file: {str(e)}",
            "warnings": [f"Unreadable or corrupt file: {str(e)}"],
            "steps": ["Image loading failed"],
            "category": "unknown",
            "confidence": 0.0,
            "top3": [],
            "style": style or "soft_studio",
            "styled_jpeg": None,
            "white_jpeg": None,
            "cutout_png": None,
            "timings": {"total_ms": round((time.time() - total_start) * 1000, 1)}
        }

    timings["load_ms"] = round((time.time() - t0) * 1000, 1)
    steps.append(f"Loaded image safely ({rgb_array.shape[1]}x{rgb_array.shape[0]} sRGB, max 2400px)")

    # Step B: Cutout
    t0 = time.time()
    try:
        mask = extract_cutout_mask(rgb_array, existing_alpha)
    except Exception as e:
        return {
            "ok": False,
            "error": f"Background removal failed: {str(e)}",
            "warnings": [f"Cutout error: {str(e)}. Keeping original photo."],
            "steps": steps + ["Cutout model failed"],
            "category": "unknown",
            "confidence": 0.0,
            "top3": [],
            "style": style or "soft_studio",
            "styled_jpeg": None,
            "white_jpeg": None,
            "cutout_png": None,
            "timings": {"total_ms": round((time.time() - total_start) * 1000, 1)}
        }
    timings["cutout_ms"] = round((time.time() - t0) * 1000, 1)
    steps.append("Extracted mask via rembg isnet-general-use + Guided Filter refinement")

    # Step C: Quality Check
    is_ok, quality_warns, coverage = evaluate_quality(mask, rgb_array.shape)
    warnings.extend(quality_warns)
    steps.append(f"Quality inspection: product covers {coverage*100:.1f}% of photo")

    if not is_ok:
        # Quality check failed: return original normalized image with ok=False
        buf = io.BytesIO()
        Image.fromarray(rgb_array).save(buf, format="JPEG", quality=90)
        orig_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
        return {
            "ok": False,
            "error": "Quality threshold not met.",
            "warnings": warnings,
            "steps": steps,
            "category": "unknown",
            "confidence": 0.0,
            "top3": [],
            "style": style or "soft_studio",
            "styled_jpeg": orig_b64,
            "white_jpeg": orig_b64,
            "cutout_png": None,
            "timings": {"total_ms": round((time.time() - total_start) * 1000, 1)}
        }

    # Step D: Category Classification
    t0 = time.time()
    top_cat, top_conf, top3, default_style, cat_warns = classify_category(rgb_array, mask)
    warnings.extend(cat_warns)
    timings["category_ms"] = round((time.time() - t0) * 1000, 1)
    steps.append(f"OpenCLIP identified category '{top_cat}' with {top_conf*100:.1f}% confidence")

    selected_style = style if style in CATEGORY_MAP.values() or style == "white" else default_style

    # Step E: Color-Safe Enhancement
    t0 = time.time()
    enhanced_rgb = enhance_product_pixels(rgb_array, mask, strength=strength)
    timings["enhance_ms"] = round((time.time() - t0) * 1000, 1)
    steps.append("Color-safe LAB lightness calibrated (A/B hue & saturation 100% preserved)")

    # Step F & G: Procedural Backgrounds
    t0 = time.time()
    styled_bg = generate_procedural_background(selected_style, size=size)
    white_bg = generate_procedural_background("white", size=size)

    # Step H: Compositing
    styled_final = composite_product(enhanced_rgb, mask, styled_bg, selected_style, size=size)
    white_final = composite_product(enhanced_rgb, mask, white_bg, "white", size=size)

    # Cutout PNG: transparent background
    ys, xs = np.where(mask > 128)
    min_x, max_x = max(0, xs.min()), min(rgb_array.shape[1], xs.max() + 1)
    min_y, max_y = max(0, ys.min()), min(rgb_array.shape[0], ys.max() + 1)
    cutout_rgba = np.dstack([enhanced_rgb[min_y:max_y, min_x:max_x], mask[min_y:max_y, min_x:max_x]])

    timings["composite_ms"] = round((time.time() - t0) * 1000, 1)
    timings["total_ms"] = round((time.time() - total_start) * 1000, 1)
    steps.append(f"Rendered branded composite with natural contact shadow on '{selected_style}' style")

    # Encode outputs as base64 data URLs
    # 1. Styled JPEG (quality 92)
    s_buf = io.BytesIO()
    Image.fromarray(styled_final).save(s_buf, format="JPEG", quality=92, optimize=True)
    styled_jpeg_b64 = "data:image/jpeg;base64," + base64.b64encode(s_buf.getvalue()).decode("utf-8")

    # 2. White JPEG (quality 92)
    w_buf = io.BytesIO()
    Image.fromarray(white_final).save(w_buf, format="JPEG", quality=92, optimize=True)
    white_jpeg_b64 = "data:image/jpeg;base64," + base64.b64encode(w_buf.getvalue()).decode("utf-8")

    # 3. Cutout PNG
    c_buf = io.BytesIO()
    Image.fromarray(cutout_rgba).save(c_buf, format="PNG", optimize=True)
    cutout_png_b64 = "data:image/png;base64," + base64.b64encode(c_buf.getvalue()).decode("utf-8")

    return {
        "ok": True,
        "styled_jpeg": styled_jpeg_b64,
        "white_jpeg": white_jpeg_b64,
        "cutout_png": cutout_png_b64,
        "category": top_cat,
        "confidence": top_conf,
        "top3": top3,
        "style": selected_style,
        "steps": steps,
        "warnings": warnings,
        "timings": timings
    }


# ------------------------------------------------------------------------------
# RESTYLE FUNCTION (Fast Background Change from Cached Cutout)
# ------------------------------------------------------------------------------
def restyle(
    cutout_src: Union[str, bytes, Image.Image],
    style: str,
    size: int = 1600
) -> Dict[str, Any]:
    """
    Renders a new background style quickly from the cached cutout PNG
    without re-running rembg or OpenCLIP.
    """
    t0 = time.time()
    pil_img = None

    if isinstance(cutout_src, Image.Image):
        pil_img = cutout_src
    elif isinstance(cutout_src, bytes):
        pil_img = Image.open(io.BytesIO(cutout_src))
    elif isinstance(cutout_src, str):
        if cutout_src.startswith("data:image"):
            header, b64data = cutout_src.split(",", 1)
            raw = base64.b64decode(b64data)
            pil_img = Image.open(io.BytesIO(raw))
        else:
            pil_img = Image.open(cutout_src)

    rgba = pil_img.convert("RGBA")
    np_rgba = np.array(rgba)
    rgb = np_rgba[:, :, :3]
    mask = np_rgba[:, :, 3]

    bg = generate_procedural_background(style, size=size)
    composited = composite_product(rgb, mask, bg, style, size=size)

    buf = io.BytesIO()
    Image.fromarray(composited).save(buf, format="JPEG", quality=92, optimize=True)
    styled_jpeg = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "ok": True,
        "style": style,
        "styled_jpeg": styled_jpeg,
        "render_time_ms": round((time.time() - t0) * 1000, 1)
    }
