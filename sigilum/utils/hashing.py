from __future__ import annotations
import hashlib, json
from pathlib import Path
import numpy as np

def sha1_bytes(b: bytes) -> str:
    return hashlib.sha1(b).hexdigest()

def sha1_file(path: str | Path) -> str:
    p = Path(path)
    h = hashlib.sha1()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def sha1_image(img: np.ndarray) -> str:
    # robusto a dtype/contig
    return sha1_bytes(np.ascontiguousarray(img).tobytes())

def fingerprint(obj) -> str:
    """Fingerprint estable de params dict/list/escalares."""
    s = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha1(s.encode("utf-8")).hexdigest()[:8]
