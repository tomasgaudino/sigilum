from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class MorphologyPhase(PhaseBase):
    def apply(self, img, open_sz: int = 1, open_iter: int = 1, close_sz: int = 3, close_iter: int = 1, min_area: int = 0, **_):
        out = img.copy()
        if open_sz > 0 and open_iter > 0:
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_sz, open_sz))
            out = cv2.morphologyEx(out, cv2.MORPH_OPEN, k, iterations=open_iter)
        if close_sz > 0 and close_iter > 0:
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close_sz, close_sz))
            out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, k, iterations=close_iter)
        if min_area > 0:
            cnts, _ = cv2.findContours((out>0).astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            mask = np.zeros_like(out)
            for c in cnts:
                if cv2.contourArea(c) >= min_area:
                    cv2.drawContours(mask, [c], -1, 255, -1)
            out = cv2.bitwise_and(out, mask)
        return out
