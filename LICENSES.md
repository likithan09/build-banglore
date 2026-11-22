# Software & AI Model Licenses — KALASETU Image Enhancement Pipeline

This document lists the open-source libraries, frameworks, models, and pretrained weights used by the automated product image enhancement and classification pipeline in KALASETU.

> **Notice**: The user/organization deploying this system commercially must independently verify all upstream licenses on their official repositories or model cards before commercial redistribution.

---

## 1. Libraries & Frameworks

| Component | License | Repository / Source | Usage in KALASETU |
| :--- | :--- | :--- | :--- |
| **rembg** | MIT | https://github.com/danielgatis/rembg | Python wrapper for background removal pipeline and mask extraction. |
| **onnxruntime** | MIT | https://github.com/microsoft/onnxruntime | High-performance inference engine for running IS-Net ONNX models. |
| **OpenCV (`opencv-python-headless`)** | Apache-2.0 | https://github.com/opencv/opencv-python | LAB color space manipulation, edge guided filtering, and image composite math. |
| **Pillow (PIL Fork)** | HPND | https://github.com/python-pillow/Pillow | Image ingestion, EXIF rotation normalization, dimensions, and saving. |
| **NumPy** | BSD 3-Clause | https://github.com/numpy/numpy | Procedural gradient generation, vignette creation, and array masking. |
| **PyTorch (`torch`)** | Modified BSD | https://github.com/pytorch/pytorch | Deep learning framework powering OpenCLIP zero-shot inference. |
| **open_clip_torch** | MIT | https://github.com/mlfoundations/open_clip | Zero-shot product craft category classifier. |

---

## 2. Pretrained AI Models & Weights

| Model / Weights | Permissive License | Source / Model Card | Usage in KALASETU |
| :--- | :--- | :--- | :--- |
| **IS-Net General Use (`isnet-general-use`)** | **Apache-2.0** | https://github.com/xuebinqin/DIS | Dichotomous Image Segmentation model for high-precision product cutouts. Fully permissive for commercial use (unlike non-commercial models such as BRIA RMBG-1.4). |
| **OpenCLIP ViT-B-32 (`laion2b_s34b_b79k`)** | **MIT** | https://huggingface.co/laion/CLIP-ViT-B-32-laion2B-s34B-b79K | Vision-Language model for zero-shot craft and merchandise category classification. |

---

## 3. License Compliance & Commercial Use Rules

1. **No Non-Commercial Datasets/Models**: This pipeline strictly excludes non-commercial models (such as BRIA RMBG or non-commercial research checkpoints).
2. **Offline & Self-Contained**: All models run on local CPU via ONNX Runtime and PyTorch without making unauthorized external calls or transmitting seller product imagery to third-party cloud APIs.
3. **Product Pixel Preservation**: The pipeline preserves real product pixels (color, shape, logos, textures) and does not perform generative upscaling or synthetic product hallucination.
