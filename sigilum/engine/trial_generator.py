from __future__ import annotations
from typing import Dict, Any, List
import itertools

def _product_space(space: Dict[str, Any]) -> List[Dict[str, Any]]:
    # space: {"block_size":[21,29], "C":[3,5]} -> [{"block_size":21,"C":3},...]
    keys = list(space.keys())
    vals = [space[k] if isinstance(space[k], list) else [space[k]] for k in keys]
    return [dict(zip(keys, combo)) for combo in itertools.product(*vals)]

def expand_trials(pipeline_cfg: dict, search_spaces: dict, max_trials: int | None = None) -> List[List[dict]]:
    """
    Devuelve una lista de pipelines concretos (cada uno: lista de steps con params fijos).
    Aplica búsqueda cartesiana SOLO en las fases listadas en search_spaces.
    """
    steps = pipeline_cfg["pipeline"]
    # para cada step, generar lista de variantes de ese step
    step_variants: List[List[dict]] = []
    for step in steps:
        phase = step["phase"]
        base_params = step.get("params", {})
        if phase in search_spaces:
            combos = _product_space(search_spaces[phase])
            variants = [{"phase": phase, "params": {**base_params, **c}} for c in combos]
        else:
            variants = [{"phase": phase, "params": dict(base_params)}]
        step_variants.append(variants)

    # cartesiano sobre los steps (cada elemento es un pipeline completo)
    all_pipelines: List[List[dict]] = []
    for combo in itertools.product(*step_variants):
        all_pipelines.append([dict(s) for s in combo])

    if max_trials is not None:
        all_pipelines = all_pipelines[:max_trials]
    return all_pipelines
