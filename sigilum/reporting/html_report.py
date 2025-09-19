from __future__ import annotations
import argparse, json
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd

def _latest_run(runs_root: Path) -> Path:
    dirs = [p for p in runs_root.iterdir() if p.is_dir()]
    if not dirs:
        raise SystemExit("No hay runs en ./runs")
    return max(dirs, key=lambda p: p.stat().st_mtime)

def _load_timings(run_root: Path) -> Dict[int, float]:
    tj = run_root / "aggregate" / "timings.json"
    if not tj.exists():
        return {}
    data = json.loads(tj.read_text(encoding="utf-8"))
    idx2ms = {int(x["trial_idx"]): float(x["ms"]) for x in data.get("trials", [])}
    return idx2ms

def _collect_trials(run_root: Path) -> pd.DataFrame:
    trials_dir = run_root / "trials"
    rows: List[Dict[str, Any]] = []
    idx2ms = _load_timings(run_root)

    # detectar todas las métricas presentes para columnas consistentes
    metric_names = set()

    for td in sorted(trials_dir.glob("trial_*")):
        summ = td / "summary.json"
        if not summ.exists():
            continue
        s = json.loads(summ.read_text(encoding="utf-8"))
        t_idx = int(s.get("trial_idx", -1))
        best = s.get("best", {}) or {}
        per_metric = best.get("per_metric", {}) or {}
        metric_names.update(per_metric.keys())
        rows.append({
            "trial_idx": t_idx,
            "best_score": float(best.get("score", -1.0)),
            "best_firma": best.get("firma"),
            "time_ms": float(idx2ms.get(t_idx, 0.0)),
            "summary_path": str(summ.relative_to(run_root))
        } | {f"m_{k}": float(v) for k, v in per_metric.items()})

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    # asegurar columnas para todas las métricas
    for m in sorted(metric_names):
        col = f"m_{m}"
        if col not in df.columns:
            df[col] = pd.NA
    df = df.sort_values(["best_score", "trial_idx"], ascending=[False, True]).reset_index(drop=True)
    return df

def main():
    ap = argparse.ArgumentParser(description="Resumen de trials de un run de Sigilum")
    ap.add_argument("--run", help="Ruta al run (e.g., runs/20250919_...)")
    ap.add_argument("--latest", action="store_true", help="Tomar el run más reciente de ./runs")
    ap.add_argument("--top", type=int, default=20, help="Mostrar N filas en consola (default 20)")
    args = ap.parse_args()

    runs_root = Path("runs")
    if args.run:
        run_root = Path(args.run)
    elif args.latest:
        run_root = _latest_run(runs_root)
    else:
        raise SystemExit("Especificá --run <dir> o --latest")

    if not run_root.exists():
        raise SystemExit(f"No existe el run: {run_root}")

    df = _collect_trials(run_root)
    if df.empty:
        raise SystemExit(f"Sin summary.json en {run_root}/trials/*")

    out_csv = run_root / "aggregate" / "trials_summary.csv"
    out_json = run_root / "aggregate" / "trials_summary.json"
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_csv, index=False)
    df.to_json(out_json, orient="records", indent=2, force_ascii=False)

    # imprimir resumen corto
    cols = ["trial_idx", "best_score", "best_firma", "time_ms"] + [c for c in df.columns if c.startswith("m_")]
    print(f"\nRun: {run_root}")
    print(f"Guardado: {out_csv}  &  {out_json}\n")
    print(df[cols].head(args.top).to_string(index=False))

if __name__ == "__main__":
    main()
