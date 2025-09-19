# sigilum/utils/viz.py
from __future__ import annotations
import cv2, numpy as np

def overlay_edges(base_gray, candidate_gray, edge_thresh: int = 80, size=(256,256)):
    base = cv2.cvtColor(cv2.resize(base_gray, size), cv2.COLOR_GRAY2BGR)
    cand = cv2.resize(candidate_gray, size)
    e = cv2.Canny(cand, edge_thresh, edge_thresh*2)
    color = base.copy()
    color[e > 0] = (0, 0, 255)
    return color

def side_by_side(a_gray, b_gray, size=(256,256)):
    a = cv2.cvtColor(cv2.resize(a_gray, size), cv2.COLOR_GRAY2BGR)
    b = cv2.cvtColor(cv2.resize(b_gray, size), cv2.COLOR_GRAY2BGR)
    return np.hstack([a, b])
