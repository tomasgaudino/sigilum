from __future__ import annotations
import cv2
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class ColorSelectPhase(PhaseBase):
    def apply(self, img, enabled: bool = False, space: str = "LAB", channel: int = 1, **_):
        if not enabled: return img
        if space == "LAB":
            lab = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR) if img.ndim==2 else img
            lab = cv2.cvtColor(lab, cv2.COLOR_BGR2LAB)
            ch = lab[:,:,min(max(channel,0),2)]
            return ch
        if space == "HSV":
            hsv = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR) if img.ndim==2 else img
            hsv = cv2.cvtColor(hsv, cv2.COLOR_BGR2HSV)
            ch = hsv[:,:,min(max(channel,0),2)]
            return ch
        return img
