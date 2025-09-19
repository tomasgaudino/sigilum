# sigilum/engine/phase_engine.py
from __future__ import annotations
from typing import List, Dict, Any
import time
from sigilum.phases.base import get_phase_cls
from sigilum.io.cache import cache_key, load_from_cache, save_to_cache
from sigilum.utils.logger import get_logger

def run_pipeline(img, steps: List[Dict[str, Any]], use_cache: bool = True):
    """
    steps: [{"phase": "DeskewBorder", "params": {...}}, ...]
    Devuelve: (imagen_resultado, snapshots[list[dict]])
    """
    log = get_logger()
    out = img
    snapshots = []
    log.debug(f"Pipeline start | {len(steps)} fases")
    for i, step in enumerate(steps, start=1):
        phase_name = step["phase"]
        params = step.get("params", {})
        cls = get_phase_cls(phase_name)
        phase = cls()

        t0 = time.perf_counter()
        key = cache_key(phase.name, params, out)
        cached = load_from_cache(key) if use_cache else None
        if cached is not None:
            out = cached
            dt = (time.perf_counter() - t0) * 1000
            log.debug(f"[{i:02d}] {phase.name} (cache hit) {dt:.1f} ms")
        else:
            log.debug(f"[{i:02d}] {phase.name} start …")
            out = phase.apply(out, **params)
            save_to_cache(key, out)
            dt = (time.perf_counter() - t0) * 1000
            log.debug(f"[{i:02d}] {phase.name} done in {dt:.1f} ms (cache miss)")

        snapshots.append({"idx": i, "phase": phase.name, "params": params, "cache_key": key, "ms": round(dt,1)})
    log.debug("Pipeline end")
    return out, snapshots
