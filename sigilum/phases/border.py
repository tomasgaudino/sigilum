from __future__ import annotations
import cv2
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class BorderBlurPhase(PhaseBase):
    def apply(self, img, gauss_sigma: float = 3.0, **_):
        k = max(1, int(gauss_sigma*3) | 1)
        return cv2.GaussianBlur(img, (k,k), gauss_sigma)
