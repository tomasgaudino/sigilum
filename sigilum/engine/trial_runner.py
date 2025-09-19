from __future__ import annotations
from pathlib import Path
from typing import Dict, Any, List
import json, glob, time
import cv2

from sigilum.io.loader import load_image_gray
from sigilum.engine.phase_engine import run_pipeline
from sigilum.engine.metrics import get_metric
from sigilum.engine.trial_generator import expand_trials
from sigilum.utils.config import load_yaml, validate_pipeline_cfg, validate_metrics_cfg
from sigilum.io.saver import create_run_dir, copy_firmas_into_run, save_snapshot, save_json
from sigilum.utils.viz import overlay_edges, side_by_side
from sigilum.utils.logger import get_logger, add_file_logging
from sigilum.utils.hashing import fingerprint  # NEW

def _combine_scores(scores: Dict[str, float], metrics_cfg: dict) -> float:
    comb = metrics_cfg.get("combiner", "weighted_sum")
    weights = {m["name"]: m.get("weight", 1.0) for m in metrics_cfg["metrics"]}
    if comb == "weighted_sum":
        num = sum(scores[k] * weights.get(k, 1.0) for k in scores)
        den = sum(weights.get(k, 1.0) for k in scores)
        return float(num / den) if den else 0.0
    raise ValueError(f"Combiner desconocido: {comb}")

def _glob_firmas(dir_: str) -> List[str]:
    exts = ("*.jpg", "*.jpeg", "*.png")
    files = []
    for e in exts:
        files.extend(glob.glob(str(Path(dir_) / e)))
    return sorted(files)

def _phase_params_subset(steps: List[dict], phases_of_interest: List[str]) -> Dict[str, dict]:  # NEW
    out: Dict[str, dict] = {}
    for s in steps:
        if s["phase"] in phases_of_interest:
            out[s["phase"]] = dict(s.get("params", {}))
    return out

def run_sigilum(cheque_path: str, cuenta_id: str, firmas_dir: str,
                pipeline_cfg: str, search_cfg: str, metrics_cfg: str, mode: str = "both"):
    log = get_logger()
    t_run0 = time.perf_counter()

    # Cargar configs
    pipe_cfg = load_yaml(pipeline_cfg); validate_pipeline_cfg(pipe_cfg)
    search = load_yaml(search_cfg) or {}
    metrics = load_yaml(metrics_cfg); validate_metrics_cfg(metrics)

    target_size = tuple(metrics.get("target_size", [256, 256]))
    th_accept  = metrics.get("thresholds", {}).get("accept", 0.80)
    th_early   = metrics.get("thresholds", {}).get("early_stop", 0.88)
    min_margin = metrics.get("thresholds", {}).get("min_margin", 0.05)

    # Crear run dir y log a archivo
    run_root = create_run_dir(cheque_path, cuenta_id, pipeline_cfg, search_cfg, metrics_cfg)
    add_file_logging(run_root / "logs" / "run.log")
    log.info(f"Run dir: {run_root}")
    log.info(f"Thresholds: accept={th_accept} early={th_early} min_margin={min_margin} | target_size={target_size}")

    # IO
    t0 = time.perf_counter()
    cheque = load_image_gray(cheque_path)
    firmas_paths = _glob_firmas(firmas_dir)
    firmas_in_run = copy_firmas_into_run(run_root, firmas_paths)
    log.info(f"Loaded cheque and {len(firmas_in_run)} firmas in {(time.perf_counter()-t0)*1000:.0f} ms")

    # Trials
    phases_in_search = [k for k, v in search.items() if isinstance(v, dict) or isinstance(v, list)]  # NEW
    max_trials = search.get("max_combinations") or search.get("trials", {}).get("max_combinations")
    pipelines = expand_trials(pipe_cfg, search, max_trials=max_trials)
    if not pipelines:
        pipelines = [pipe_cfg["pipeline"]]

    # Log a snapshot of the first few trials (what will actually vary)
    sigs = []
    for idx, steps in enumerate(pipelines[:10], start=1):  # NEW
        sig = fingerprint(steps)
        sigs.append(sig)
        varying = _phase_params_subset(steps, phases_in_search)
        log.info(f"Trial {idx:04d} signature={sig} varying={varying}")
    unique_sigs = len(set(fingerprint(steps) for steps in pipelines))  # NEW
    log.info(f"Generated {len(pipelines)} trial(s) (unique signatures={unique_sigs}, max={max_trials if max_trials else '∞'})")  # NEW
    if unique_sigs == 1 and len(pipelines) > 1:  # NEW
        log.warning("All pipelines look identical (same signature). Check your search_spaces phase keys and params.")

    leaderboard = []
    per_firma_best: Dict[str, Dict[str, Any]] = {}
    timings = {"trials": []}

    for t_idx, steps in enumerate(pipelines, start=1):
        t_trial0 = time.perf_counter()
        trial_dir = run_root / "trials" / f"trial_{t_idx:04d}"
        (trial_dir / "stages").mkdir(parents=True, exist_ok=True)

        pipe_sig = fingerprint(steps)  # NEW
        log.info(f"Trial {t_idx:04d} start | {len(steps)} fases | signature={pipe_sig}")  # NEW

        # Pipeline
        out_img, snapshots = run_pipeline(cheque, steps, use_cache=True)
        save_snapshot(trial_dir / "stages" / "final.png", out_img)
        save_json(trial_dir / "phases_chain.json",
                  {"steps": snapshots, "steps_def": steps, "signature": pipe_sig})  # NEW

        # Comparaciones
        trial_best = {"firma": None, "score": -1.0, "per_metric": {}, "path": None}
        comparisons = []
        for i, fpath in enumerate(firmas_in_run, start=1):
            img_f = load_image_gray(fpath)
            a = cv2.resize(out_img, target_size)
            b = cv2.resize(img_f,  target_size)

            per_metric = {}
            for m in metrics["metrics"]:
                fn = get_metric(m["name"])
                per_metric[m["name"]] = float(fn(a, b, size=target_size, **m.get("params", {})))
            score = _combine_scores(per_metric, metrics)
            comparisons.append({"firma": Path(fpath).name, "score": score, "per_metric": per_metric})

            ov = overlay_edges(a, b, size=target_size)
            save_snapshot(trial_dir / "overlays" / f"overlay_{Path(fpath).stem}.png", ov)
            sb = side_by_side(a, b, size=target_size)
            save_snapshot(trial_dir / "pairs" / f"pair_{Path(fpath).stem}.png", sb)

            if score > trial_best["score"]:
                trial_best = {"firma": Path(fpath).name, "score": score, "per_metric": per_metric, "path": str(fpath)}

            if mode in ("early", "both") and score >= th_early:
                log.info(f"Trial {t_idx:04d} early-stop by score ≥ {th_early} on {Path(fpath).name}")
                break

        save_json(trial_dir / "summary.json", {
            "trial_idx": t_idx,
            "signature": pipe_sig,            # NEW
            "best": trial_best,
            "thresholds": {"accept": th_accept, "early_stop": th_early, "min_margin": min_margin}
        })

        leaderboard.append({"trial_idx": t_idx, "signature": pipe_sig, "best_score": trial_best["score"], "best_firma": trial_best["firma"]})

        t_trial = (time.perf_counter() - t_trial0) * 1000
        timings["trials"].append({"trial_idx": t_idx, "ms": round(t_trial, 1)})
        log.info(f"Trial {t_idx:04d} end | score={trial_best['score']:.4f} | {t_trial:.1f} ms")

    # Agregados
    leaderboard_sorted = sorted(leaderboard, key=lambda x: x["best_score"], reverse=True)
    save_json(run_root / "aggregate" / "leaderboard.json", {"leaderboard": leaderboard_sorted})

    best_overall = leaderboard_sorted[0] if leaderboard_sorted else {"best_score": -1.0, "trial_idx": None}
    status = "REVIEW"
    if best_overall["best_score"] >= th_accept:
        if len(leaderboard_sorted) > 1:
            margin = best_overall["best_score"] - leaderboard_sorted[1]["best_score"]
            status = "ACCEPTED" if margin >= min_margin else "REVIEW"
        else:
            status = "ACCEPTED"

    timings["total_ms"] = round((time.perf_counter() - t_run0) * 1000, 1)
    save_json(run_root / "aggregate" / "timings.json", timings)

    # actualizar run.json
    run_meta_path = run_root / "run.json"
    meta = json.loads(run_meta_path.read_text(encoding="utf-8"))
    meta.update({
        "status": status,
        "best_trial": best_overall,
        "n_trials": len(pipelines),
        "target_size": list(target_size),
        "max_trials": max_trials
    })
    run_meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({
        "run_dir": str(run_root),
        "status": status,
        "best_trial": best_overall,
        "timings_ms": timings["total_ms"]
    }, ensure_ascii=False, indent=2))
