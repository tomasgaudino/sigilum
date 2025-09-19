from __future__ import annotations
import cv2
import numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class BinarizationPhase(PhaseBase):
    def apply(self, img, mode: str = "adaptive", invert: bool = False,
              adaptive_window: int = 35, adaptive_C: int = 7,
              sauvola_window: int = 41, sauvola_k: float = 0.3, **_):
        out = img
        if mode == "adaptive":
            if adaptive_window % 2 == 0: adaptive_window += 1
            out = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY, adaptive_window, adaptive_C)
        elif mode == "otsu":
            _, out = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        elif mode == "sauvola":
            # implementación simple usando filtro de media/var local
            w = max(3, sauvola_window | 1)
            mean = cv2.boxFilter(img.astype("float32"), -1, (w, w), normalize=True)
            mean_sq = cv2.boxFilter((img.astype("float32")**2), -1, (w, w), normalize=True)
            var = np.clip(mean_sq - mean**2, 0, None)
            std = np.sqrt(var)
            R = 128.0
            thresh = mean * (1 + sauvola_k * ((std / R) - 1))
            out = (img > thresh).astype("uint8") * 255
        else:
            raise ValueError(f"mode {mode} inválido")
        if invert:
            out = 255 - out
        return out
