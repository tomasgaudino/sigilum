from __future__ import annotations
from typing import Callable, Dict, Any
import numpy as np
from skimage.metrics import structural_similarity as ssim
import cv2

_METRICS: Dict[str, Callable[..., float]] = {}

def register_metric(name: str):
    def deco(fn: Callable[..., float]):
        _METRICS[name] = fn
        return fn
    return deco

def get_metric(name: str) -> Callable[..., float]:
    if name not in _METRICS:
        raise KeyError(f"Métrica '{name}' no registrada. {list(_METRICS)}")
    return _METRICS[name]

@register_metric("ssim")
def metric_ssim(a: np.ndarray, b: np.ndarray, win_size: int = 7, **_):
    a, b = _resize_match(a, b)
    score, _ = ssim(a, b, full=True, win_size=win_size)
    return float(max(0.0, min(1.0, score)))

@register_metric("chamfer")
def metric_chamfer(a: np.ndarray, b: np.ndarray, edge_thresh: int = 80, **_):
    a, b = _resize_match(a, b)
    ea = cv2.Canny(a, edge_thresh, edge_thresh * 2)
    eb = cv2.Canny(b, edge_thresh, edge_thresh * 2)
    da = cv2.distanceTransform(255 - ea, cv2.DIST_L2, 3)
    db = cv2.distanceTransform(255 - eb, cv2.DIST_L2, 3)
    # distancia simétrica normalizada (menor mejor) -> score (mayor mejor)
    d = (da[eb > 0].mean() + db[ea > 0].mean()) / 2.0 if (eb > 0).any() and (ea > 0).any() else 1e6
    return float(1.0 / (1.0 + d))

def _resize_match(a, b, size=(256, 256)):
    if a.shape != size:
        a = cv2.resize(a, size, interpolation=cv2.INTER_AREA)
    if b.shape != size:
        b = cv2.resize(b, size, interpolation=cv2.INTER_AREA)
    return a, b

@register_metric("ncc")
def metric_ncc(a, b, **kwargs):
    a, b = _resize_match(a, b, kwargs.get("size", (256,256)))
    a = a.astype("float32"); b = b.astype("float32")
    a = (a - a.mean()) / (a.std() + 1e-6)
    b = (b - b.mean()) / (b.std() + 1e-6)
    return float(np.clip((a*b).mean(), -1.0, 1.0) * 0.5 + 0.5)  # map [-1,1]->[0,1]

@register_metric("mse")
def metric_mse(a, b, **kwargs):
    a, b = _resize_match(a, b, kwargs.get("size", (256,256)))
    mse = np.mean((a.astype("float32") - b.astype("float32"))**2)
    return float(1.0 / (1.0 + mse))  # menor error -> mayor score

@register_metric("orb_inliers")
def metric_orb_inliers(a, b, n_features: int = 1000, ransacReprojThreshold: float = 5.0, **kwargs):
    a, b = _resize_match(a, b, kwargs.get("size", (256,256)))
    orb = cv2.ORB_create(nfeatures=int(n_features))
    ka, da = orb.detectAndCompute(a, None)
    kb, db = orb.detectAndCompute(b, None)
    if da is None or db is None or len(ka) < 4 or len(kb) < 4:
        return 0.0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    ms = bf.match(da, db)
    if len(ms) < 8:
        return 0.0
    ptsA = np.float32([ka[m.queryIdx].pt for m in ms]).reshape(-1,1,2)
    ptsB = np.float32([kb[m.trainIdx].pt for m in ms]).reshape(-1,1,2)
    H, mask = cv2.findHomography(ptsA, ptsB, cv2.RANSAC, ransacReprojThreshold)
    if mask is None:
        return 0.0
    inlier_ratio = float(mask.sum() / (len(mask) + 1e-6))
    return np.clip(inlier_ratio, 0.0, 1.0)

def _resize_match(a, b, size=(256,256)):
    if a.shape != size:
        a = cv2.resize(a, size, interpolation=cv2.INTER_AREA)
    if b.shape != size:
        b = cv2.resize(b, size, interpolation=cv2.INTER_AREA)
    return a, b
