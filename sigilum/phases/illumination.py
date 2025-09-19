from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class IlluminationPhase(PhaseBase):
    def apply(self, img, mode: str = "none", clahe_clip: float = 2.0, clahe_tile: int = 8, bg_kernel: float = 8.0, **_):
        if mode == "none":
            return img
        if mode == "clahe":
            clahe = cv2.createCLAHE(clipLimit=float(clahe_clip), tileGridSize=(int(clahe_tile), int(clahe_tile)))
            return clahe.apply(img)
        if mode == "bg_subtract":
            k = max(3, int(bg_kernel) | 1)
            bg = cv2.GaussianBlur(img, (k, k), 0)
            out = cv2.normalize(cv2.absdiff(img, bg), None, 0, 255, cv2.NORM_MINMAX)
            return out.astype("uint8")
        raise ValueError("mode inválido (none|clahe|bg_subtract)")
