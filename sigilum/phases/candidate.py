from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class CandidatePhase(PhaseBase):
    def apply(self, img, canny_low: int = 32, canny_high: int = 40, close_sz: int = 3, min_area: int = 2300, pad: int = 8, **_):
        edges = cv2.Canny(img, canny_low, canny_high)
        k = cv2.getStructuringElement(cv2.MORPH_RECT, (close_sz, close_sz))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, k)
        cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        h, w = img.shape[:2]
        if not cnts: return img
        c = max(cnts, key=cv2.contourArea)
        if cv2.contourArea(c) < min_area: return img
        x,y,bw,bh = cv2.boundingRect(c)
        x0=max(0,x-pad); y0=max(0,y-pad); x1=min(w,x+bw+pad); y1=min(h,y+bh+pad)
        return img[y0:y1, x0:x1]
