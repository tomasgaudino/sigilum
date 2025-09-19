from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class DenoisePhase(PhaseBase):
    def apply(self, img, mode: str = "bilateral", bil_d: int = 2, bil_sigma: int = 21,
              nl_patch: int = 5, nl_dist: int = 9, nl_h: float = 0.8, **_):
        if mode == "bilateral":
            return cv2.bilateralFilter(img, int(bil_d), int(bil_sigma), int(bil_sigma))
        if mode == "nlmeans":
            return cv2.fastNlMeansDenoising(img, None, float(nl_h), int(nl_patch), int(nl_dist))
        return img
