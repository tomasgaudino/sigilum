from __future__ import annotations
import cv2, numpy as np
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class RemoveLinesBoxesPhase(PhaseBase):
    def apply(self, img, morph_h_len: int = 256, morph_v_len: int = 160, morph_iter: int = 1,
              use_hough: bool = False, canny_low: int = 50, canny_high: int = 150,
              hough_thresh: int = 80, min_line_len_frac: float = 0.25, max_line_gap: int = 10,
              angle_tol_deg: float = 7.5, erase_thickness: int = 3,
              remove_rectangles: bool = True, rect_min_area: int = 0, rect_eps_frac: float = 0.02,
              rect_min_aspect: float = 2.2, rect_min_extent: float = 0.35,
              hollow_max_extent: float = 0.6, hollow_min_wh_sum: int = 180, **_):
        out = img.copy()
        h, w = out.shape[:2]

        # Morph lines
        horiz = cv2.morphologyEx(out, cv2.MORPH_OPEN,
                                 cv2.getStructuringElement(cv2.MORPH_RECT, (int(morph_h_len), 1)),
                                 iterations=int(morph_iter))
        vert = cv2.morphologyEx(out, cv2.MORPH_OPEN,
                                cv2.getStructuringElement(cv2.MORPH_RECT, (1, int(morph_v_len))),
                                iterations=int(morph_iter))

        # ⚠️ OpenCV no acepta bool; convertir a uint8 y luego escalar a 0/255
        lines_mask = ((horiz > 0) | (vert > 0)).astype(np.uint8) * 255

        if use_hough:
            edges = cv2.Canny(out, canny_low, canny_high)
            min_len = int(min_line_len_frac * max(h, w))
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=hough_thresh,
                                    minLineLength=min_len, maxLineGap=max_line_gap)
            if lines is not None:
                for x1,y1,x2,y2 in lines[:,0]:
                    cv2.line(lines_mask, (x1,y1), (x2,y2), 255, erase_thickness)

        out[lines_mask>0] = 255

        if remove_rectangles:
            cnts, _ = cv2.findContours((img<250).astype("uint8"), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in cnts:
                area = cv2.contourArea(c)
                if area < rect_min_area: continue
                x,y,bw,bh = cv2.boundingRect(c)
                aspect = max(bw,bh) / (min(bw,bh)+1e-6)
                rect = cv2.approxPolyDP(c, rect_eps_frac * (bw+bh), True)
                extent = area / (bw*bh + 1e-6)
                hollow = (bw+bh) >= hollow_min_wh_sum and extent <= hollow_max_extent
                if len(rect) >= 4 and (aspect >= rect_min_aspect or hollow or extent <= rect_min_extent):
                    cv2.rectangle(out, (x,y), (x+bw,y+bh), 255, -1)
        return out
