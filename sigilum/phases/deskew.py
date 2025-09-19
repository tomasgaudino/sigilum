from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class DeskewBorderPhase(PhaseBase):
    def apply(self, img, canny_low: int = 50, canny_high: int = 150, hough_thresh: int = 200,
              min_apply_angle: float = 0.7, max_angle_deg: float = 5.0, **_):
        edges = cv2.Canny(img, canny_low, canny_high)
        lines = cv2.HoughLines(edges, 1, np.pi/180, hough_thresh)
        angle = 0.0
        if lines is not None:
            angles = [(theta - np.pi/2.0) for rho, theta in lines[:,0]]
            angle = float(np.degrees(np.median(angles)))
            if abs(angle) < min_apply_angle:
                angle = 0.0
            angle = float(np.clip(angle, -max_angle_deg, max_angle_deg))
        h, w = img.shape[:2]
        M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
        return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
