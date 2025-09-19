from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class AutoCropPhase(PhaseBase):
    def apply(self, img, enabled: bool = True, padding: int = 8, min_content_ratio: float = 0.0, size: tuple[int,int] = (256,256), **_):
        if not enabled:
            return cv2.resize(img, size, interpolation=cv2.INTER_AREA)
        mask = img < 250
        if mask.mean() < min_content_ratio:
            return cv2.resize(img, size, interpolation=cv2.INTER_AREA)
        coords = np.column_stack(np.where(mask))
        if coords.size == 0:
            out = img
        else:
            y0, x0 = coords.min(axis=0); y1, x1 = coords.max(axis=0) + 1
            y0 = max(0, y0 - padding); x0 = max(0, x0 - padding)
            y1 = min(img.shape[0], y1 + padding); x1 = min(img.shape[1], x1 + padding)
            out = img[y0:y1, x0:x1]
        return cv2.resize(out, size, interpolation=cv2.INTER_AREA)
