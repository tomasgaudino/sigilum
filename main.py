# main.py
import argparse
from pathlib import Path
import sigilum.phases  # registra fases
from sigilum.engine.trial_runner import run_sigilum
from sigilum.utils.logger import setup_console_logging, get_logger

def main():
    parser = argparse.ArgumentParser(description="Sigilum - cheque vs firmas")
    parser.add_argument("--cheque", required=True, help="Path a imagen de cheque")
    parser.add_argument("--cuenta", required=True, help="ID de cuenta emisora (cuenta_id)")
    parser.add_argument("--firmas_dir", required=True, help="Carpeta con firmas (jpg/png)")
    parser.add_argument("--pipeline_cfg", default="configs/pipeline_default.yaml")
    parser.add_argument("--search_cfg", default="configs/search_spaces.yaml")
    parser.add_argument("--metrics_cfg", default="configs/metrics_profile.yaml")
    parser.add_argument("--mode", choices=["absolute", "early", "both"], default="both")
    parser.add_argument("--log-level", default="INFO", help="DEBUG|INFO|WARNING|ERROR")
    args = parser.parse_args()

    # consola
    setup_console_logging(args.log_level)
    log = get_logger()

    # validaciones mínimas
    for p in [args.cheque, args.firmas_dir, args.pipeline_cfg, args.search_cfg, args.metrics_cfg]:
        if not Path(p).exists():
            raise FileNotFoundError(f"No existe: {p}")

    log.info("== Sigilum start ==")
    log.info(f"Cheque: {args.cheque} | Cuenta: {args.cuenta} | Firmas: {args.firmas_dir}")
    log.info(f"Configs → pipeline={args.pipeline_cfg} search={args.search_cfg} metrics={args.metrics_cfg}")
    log.info(f"Mode: {args.mode} | Log level: {args.log_level}")

    run_sigilum(
        cheque_path=args.cheque,
        cuenta_id=args.cuenta,
        firmas_dir=args.firmas_dir,
        pipeline_cfg=args.pipeline_cfg,
        search_cfg=args.search_cfg,
        metrics_cfg=args.metrics_cfg,
        mode=args.mode
    )

if __name__ == "__main__":
    main()
