from __future__ import annotations
from pathlib import Path
import cv2
import numpy as np

def load_image_gray(path: str | Path):
    img = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"No se pudo cargar imagen: {path}")
    return img
