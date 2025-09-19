from __future__ import annotations
from pathlib import Path
import yaml

def load_yaml(path: str | Path) -> dict:
    with Path(path).open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}

def validate_pipeline_cfg(cfg: dict):
    if "pipeline" not in cfg or not isinstance(cfg["pipeline"], list):
        raise ValueError("pipeline_default.yaml debe contener lista 'pipeline'")
    for step in cfg["pipeline"]:
        if "phase" not in step:
            raise ValueError("Cada step necesita 'phase'")
        step.setdefault("params", {})

def validate_metrics_cfg(cfg: dict):
    if "metrics" not in cfg:
        raise ValueError("metrics_profile.yaml debe contener 'metrics'")
    cfg.setdefault("combiner", "weighted_sum")
    cfg.setdefault("thresholds", {"accept": 0.8, "early_stop": 0.9, "min_margin": 0.05})
