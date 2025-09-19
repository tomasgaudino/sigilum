from __future__ import annotations
import cv2
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class AutoResizePhase(PhaseBase):
    def apply(self, img, max_side: int = 1600, **_):
        h, w = img.shape[:2]
        s = max(h, w)
        if s <= max_side: return img
        scale = max_side / s
        return cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA)
