# sigilum/io/saver.py (solo añade la carpeta logs)
from __future__ import annotations
from pathlib import Path
import json
import shutil
from datetime import datetime
import cv2
import numpy as np

def _ts() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def create_run_dir(cheque_path: str, cuenta_id: str, pipeline_cfg_path: str, search_cfg_path: str, metrics_cfg_path: str) -> Path:
    run_id = f"{_ts()}__{Path(cheque_path).stem}"
    root = Path("runs") / run_id
    (root / "input" / "firmas").mkdir(parents=True, exist_ok=True)
    (root / "configs").mkdir(parents=True, exist_ok=True)
    (root / "trials").mkdir(parents=True, exist_ok=True)
    (root / "aggregate").mkdir(parents=True, exist_ok=True)
    (root / "logs").mkdir(parents=True, exist_ok=True)  # <--- nuevo

    shutil.copy2(cheque_path, root / "input" / Path(cheque_path).name)
    shutil.copy2(pipeline_cfg_path, root / "configs" / Path(pipeline_cfg_path).name)
    shutil.copy2(search_cfg_path, root / "configs" / Path(search_cfg_path).name)
    shutil.copy2(metrics_cfg_path, root / "configs" / Path(metrics_cfg_path).name)

    (root / "run.json").write_text(json.dumps({
        "run_id": run_id,
        "cuenta_id": cuenta_id,
        "cheque_name": Path(cheque_path).name,
        "created_at": datetime.now().isoformat()
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    return root

def copy_firmas_into_run(root: Path, firmas_paths: list[str]) -> list[Path]:
    dsts = []
    for p in firmas_paths:
        dst = root / "input" / "firmas" / Path(p).name
        shutil.copy2(p, dst)
        dsts.append(dst)
    return dsts

def save_snapshot(path: Path, img: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imencode(".png", img)[1].tofile(str(path))

def save_json(path: Path, obj: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
