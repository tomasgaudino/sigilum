from __future__ import annotations
from pathlib import Path
import cv2
import numpy as np
from sigilum.utils.hashing import fingerprint, sha1_image

CACHE_ROOT = Path(".cache")

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def cache_key(phase_name: str, params: dict, input_img) -> str:
    return f"{phase_name}_{fingerprint(params)}_{sha1_image(input_img)[:8]}"

def load_from_cache(key: str):
    p = CACHE_ROOT / f"{key}.png"
    if p.exists():
        img = cv2.imdecode(np.fromfile(str(p), dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
        return img
    return None

def save_to_cache(key: str, img):
    ensure_dir(CACHE_ROOT)
    cv2.imencode(".png", img)[1].tofile(str(CACHE_ROOT / f"{key}.png"))
