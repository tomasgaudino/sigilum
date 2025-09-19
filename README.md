# Sigilum

Modular, local-first signature analysis pipeline to compare **cheque images** (from SPC) against **account-holder signatures** (from COBIS).  
Designed around **phases** (composable image ops), **search spaces** (trial generation), **metrics** (modular scoring), and **fully traceable runs** for human review.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Make Commands](#make-commands)
- [Quickstart](#quickstart)
- [Configuration](#configuration)
  - [Pipeline (`configs/pipeline_*.yaml`)](#pipeline-config)
  - [Search Spaces (`configs/search_spaces.yaml`)](#search-spaces-config)
  - [Metrics (`configs/metrics_profile.yaml`)](#metrics-config)
- [Running Experiments](#running-experiments)
- [Outputs & Traceability](#outputs--traceability)
- [Logging & Performance](#logging--performance)
- [Reporting](#reporting)
- [Extensibility](#extensibility)
  - [Add a Phase](#add-a-phase)
  - [Add a Metric](#add-a-metric)
- [Troubleshooting](#troubleshooting)
- [Notes](#notes)

---

## Features

- **Phase-based pipeline**: each phase is an operation (deskew, denoise, binarize, skeletonize, etc.). Order & params are declarative in YAML.
- **Search spaces & trials**: generate multiple pipelines by cartesian product of param grids; limit with `max_combinations`.
- **Modular metrics**: SSIM, Chamfer, NCC, MSE, ORB inliers, etc., combined via weighted sum.
- **Early-stop or absolute** matching modes.
- **Full traceability**: every run stores inputs, configs, outputs, overlays, timings, and per-trial summaries under `runs/<timestamp>__<cheque>`.
- **Human review**: side-by-side visuals and edge overlays; HTML report and CSV/JSON summaries.
- **Caching**: phase-level cache keyed by (phase, params, input hash) to speed up iterations.
- **OCR masking (optional)**: mask printed text with Tesseract to reduce noise.

---

## Project Structure

```
sigilum/
  engine/
    phase_engine.py      # runs a pipeline and snapshots timings
    trial_generator.py   # expands search spaces into pipelines
    trial_runner.py      # orchestrates a run; scoring & persistence
    metrics.py           # metric registry (ssim, chamfer, ncc, mse, orb_inliers, ...)
  phases/
    __init__.py          # registers all phases
    base.py              # PhaseBase + registry helpers
    autoresize.py, deskew.py, border.py, illumination.py,
    color.py, denoise.py, binarization.py, morphology.py,
    ocr.py, lines_boxes.py, candidate.py, skeletonize.py,
    autocrop.py
  io/
    loader.py, saver.py, cache.py
  utils/
    hashing.py, config.py, viz.py, logger.py
  reporting/
    aggregator.py, html_report.py
configs/
  pipeline_default.yaml
  pipeline_from_legacy.yaml
  search_spaces.yaml
  metrics_profile.yaml
data/
  cheques/   # put sample cheques here (png/jpg)
  firmas/    # put sample signatures here (png/jpg)
runs/        # auto-generated experiment outputs
.cache/      # phase cache
main.py      # entry point
environment.yml
Makefile
```

---

## Installation

```bash
make install
make setup-ocr         # optional; required only if using the OCRMask phase
# then either:
conda activate sigilum
# or use conda-run via Make targets (no activate needed)
```

---

## Make Commands

```bash
make run               # runs the hardcoded experiment (see variables in Makefile)
make check_last_trial  # renders HTML report for the latest run under ./runs
make install           # create conda env from environment.yml
make setup-ocr         # install Tesseract (macOS/Linux helpers)
make update            # update conda env from environment.yml
make uninstall         # remove the conda env
```

**Hardcoded variables** used by `make run` (edit in `Makefile` if needed):

- `CHEQUE = data/cheques/cheque_test_01.png`  
- `CUENTA = 001-123456/7`  
- `FIRMAS_DIR = data/firmas`  
- `PIPELINE_CFG = configs/pipeline_from_legacy.yaml`  
- `SEARCH_CFG = configs/search_spaces.yaml`  
- `METRICS_CFG = configs/metrics_profile.yaml`  
- `MODE = both`  
- `LOG_LEVEL = DEBUG`

---

## Quickstart

1) Put a cheque image in `data/cheques/` and signatures in `data/firmas/` (png/jpg).  
2) Run:

```bash
make run
# or explicitly:
python main.py   --cheque data/cheques/cheque_test_01.png   --cuenta '001-123456/7'   --firmas_dir data/firmas   --pipeline_cfg configs/pipeline_from_legacy.yaml   --search_cfg configs/search_spaces.yaml   --metrics_cfg configs/metrics_profile.yaml   --mode both   --log-level DEBUG
```

3) Open the latest report:

```bash
make check_last_trial
# opens runs/<RUN>/aggregate/report.html
```

---

## Configuration

### Pipeline config

`configs/pipeline_from_legacy.yaml` (example):

```yaml
pipeline:
  - phase: AutoResize        # shrink big inputs early for speed
    params: {max_side: 1600}

  - phase: DeskewBorder
    params: {canny_low: 50, canny_high: 150, hough_thresh: 120, min_apply_angle: 0.7, max_angle_deg: 5}

  - phase: BorderBlur        # optional light blur on borders
    params: {gauss_sigma: 3.0}

  - phase: Illumination
    params: {mode: "none", clahe_clip: 2.0, clahe_tile: 8, bg_kernel: 8.0}

  - phase: ColorSelect
    params: {enabled: false, space: "LAB", channel: 1}

  - phase: Denoise
    params: {mode: "bilateral", bil_d: 2, bil_sigma: 21, nl_patch: 5, nl_dist: 9, nl_h: 0.8}

  - phase: Binarization
    params:
      mode: "otsu"           # "otsu" | "adaptive" | "sauvola"
      invert: true
      adaptive_window: 35
      adaptive_C: 10
      sauvola_window: 41
      sauvola_k: 0.3

  - phase: Morphology
    params: {open_sz: 1, open_iter: 1, close_sz: 3, close_iter: 1, min_area: 118}

  - phase: OCRMask           # optional; mask printed text
    params: {enabled: true, lang: "eng", min_conf: 0, pad: 10}

  - phase: RemoveLinesBoxes  # remove form lines and rectangles
    params:
      morph_h_len: 256
      morph_v_len: 160
      morph_iter: 1
      use_hough: false
      canny_low: 50
      canny_high: 150
      hough_thresh: 80
      min_line_len_frac: 0.25
      max_line_gap: 10
      angle_tol_deg: 7.5
      erase_thickness: 3
      remove_rectangles: true
      rect_min_area: 0
      rect_eps_frac: 0.02
      rect_min_aspect: 2.2
      rect_min_extent: 0.35
      hollow_max_extent: 0.6
      hollow_min_wh_sum: 180

  - phase: Candidate         # coarse ROI (optional)
    params: {canny_low: 32, canny_high: 40, close_sz: 3, min_area: 2300, pad: 8}

  - phase: AutoCrop          # normalize canvas and size
    params: {enabled: true, padding: 10, min_content_ratio: 0.01, size: [256, 256]}

  - phase: Skeletonization   # place after AutoCrop to save time
    params: {enabled: true, method: "skimage", resize_before: false, size: [256, 256], max_ms: 2000}
```

> **Tip:** Order matters. Heavy phases (e.g., Skeletonization) perform better after `AutoCrop`.

---

### Search spaces config

`configs/search_spaces.yaml`:

```yaml
max_combinations: 50      # global cap on generated pipelines

Binarization:
  mode: ["otsu", "adaptive", "sauvola"]
  adaptive_window: [29, 35, 41]
  adaptive_C: [5, 10]
  sauvola_window: [31, 41]
  sauvola_k: [0.2, 0.3]

Skeletonization:
  enabled: [true, false]  # this guarantees visual differences
```

- The keys **must match** `phase` names in your pipeline (e.g., `Binarization`, not `bin`).
- Trials are generated by the cartesian product across listed parameters; limited by `max_combinations`.

---

### Metrics config

`configs/metrics_profile.yaml`:

```yaml
target_size: [256, 256]   # shared size for scoring & overlays

metrics:
  - {name: "ssim",         weight: 0.5, params: {win_size: 7}}
  - {name: "ncc",          weight: 0.3, params: {}}
  - {name: "mse",          weight: 0.2, params: {}}
  - {name: "orb_inliers",  weight: 0.3, params: {n_features: 1000, ransacReprojThreshold: 5.0}}

combiner: "weighted_sum"

thresholds:
  accept: 0.80
  early_stop: 0.88
  min_margin: 0.05
```

- All metrics accept `size=<target_size>` (handled automatically).
- Weights don’t need to sum to 1; the combiner normalizes by total weight.

---

## Running Experiments

- **Console run**: `make run`  
- **Manual**: see [Quickstart](#quickstart)  
- Modes:
  - `absolute`: evaluate all signatures vs. all pipelines
  - `early`: stop as soon as a score crosses `early_stop`
  - `both`: absolute + early-stop within each trial

The program prints a JSON summary with `run_dir`, `status`, `best_trial`, and execution time.

---

## Outputs & Traceability

Inside `runs/<timestamp>__<cheque_stem>/`:

```
configs/            # copied configs used for this run
input/
  cheque.png
  firmas/*.png      # copies of compared signatures
logs/
  run.log           # detailed logs (DEBUG/INFO)
trials/
  trial_0001/
    phases_chain.json   # ordered steps, params, cache keys, ms per phase
    stages/final.png    # final pipeline output (after all phases)
    overlays/*.png      # edges overlay (candidate over processed cheque)
    pairs/*.png         # side-by-side images (A vs B)
    summary.json        # best score, metrics per trial, thresholds, signature
aggregate/
  leaderboard.json      # top trials by score
  best_by_firma.json    # best score by signature file
  timings.json          # per-trial timings + total
  trials_summary.csv    # flat table across trials
  trials_summary.json
  report.html           # navigable report (generated via reporting)
run.json                # overall status, thresholds, target_size, etc.
```

---

## Logging & Performance

- Console log level via `--log-level` (e.g., `DEBUG` for detailed timings).
- File logs are always written to `runs/<run>/logs/run.log`.
- Phase cache lives under `.cache/` to avoid recomputing identical steps.
- Skeletonization tips:
  - Put after `AutoCrop`.
  - Use `method: "skimage"` (fast). If not installed, fallback is morphology with `max_ms` and `max_iter` guards.
  - `resize_before: true` with a small `size` speeds things up.

---

## Reporting

- **Summary table (CSV/JSON + console)**:
  ```bash
  python -m sigilum.reporting.aggregator --latest
  # or
  python -m sigilum.reporting.aggregator --run runs/<your_run_dir>
  ```

- **HTML report**:
  ```bash
  make check_last_trial
  # under the hood:
  # python -m sigilum.reporting.html_report --run runs/<latest_run>
  ```

The aggregator includes each trial’s **signature** (hash of steps/params) to confirm that trials differ.

---

## Extensibility

### Add a Phase

1) Create a file `sigilum/phases/<myphase>.py`:

```python
from sigilum.phases.base import PhaseBase, register_phase

@register_phase
class MyCoolPhase(PhaseBase):
    def apply(self, img, foo: int = 42, bar: bool = True, **_):
        # do stuff with img and return a new numpy array
        return img
```

2) Import it in `sigilum/phases/__init__.py` to register.
3) Reference it in your `pipeline_*.yaml`:

```yaml
- phase: MyCoolPhase
  params: {foo: 7}
```

4) Optionally expose params in `search_spaces.yaml` to create trials.

### Add a Metric

```python
from sigilum.engine.metrics import register_metric

@register_metric("my_metric")
def my_metric(a, b, size=(256,256), **kwargs):
    # a,b are np.ndarray already resized to `size`
    return float(score_in_[0,1])
```

Then reference it in `metrics_profile.yaml`:

```yaml
metrics:
  - {name: "my_metric", weight: 0.2, params: {some_param: 1}}
```

---

## Troubleshooting

- **`KeyError: Phase 'X' no registrada`**  
  Ensure `import sigilum.phases` happens in `main.py` and that `sigilum/phases/__init__.py` imports your new phase module.

- **OCR error: `'int' object has no attribute 'isdigit'`**  
  Fixed in `OCRMaskPhase` by robust parsing; ensure you have the updated file.

- **OpenCV bool mask error** (`bitwise_or` expects uint8)**  
  Fixed in `RemoveLinesBoxesPhase` by casting `(mask).astype(np.uint8)*255`.

- **Skeletonization appears stuck**  
  Use `method: "skimage"` or `resize_before: true` + `max_ms` guard; place after `AutoCrop`.

- **All trials look identical**  
  - Confirm `search_spaces.yaml` keys match pipeline `phase` names exactly.  
  - Use `DEBUG` logs: you’ll see `signature=<hash>` per trial; `unique signatures=1` means identical pipelines.  
  - Make a param that *must* vary (e.g., `Skeletonization.enabled: [true, false]`) to verify the system.

---

## Notes

- Input images supported: **PNG/JPG** (grayscale processing internally).
- This is a **local** tool; OCR via Tesseract is optional and installed via `make setup-ocr`.
- The system favors **clarity and traceability** over premature micro-optimizations; use caching and `target_size` wisely.
