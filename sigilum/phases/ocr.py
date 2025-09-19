from __future__ import annotations
import cv2
import pytesseract
from sigilum.phases.base import PhaseBase, register_phase

def _to_int_conf(v) -> int:
    """Convierte confianza a int, soportando int/float/str/None."""
    try:
        if v is None:
            return -1
        if isinstance(v, (int, float)):
            return int(v)
        s = str(v).strip()
        if s == "" or s.lower() == "nan":
            return -1
        return int(float(s))
    except Exception:
        return -1

def _to_int(v, default=0) -> int:
    try:
        if isinstance(v, (int, float)):
            return int(v)
        return int(float(str(v)))
    except Exception:
        return int(default)

@register_phase
class OCRMaskPhase(PhaseBase):
    def apply(self, img, enabled: bool = True, lang: str = "eng",
              min_conf: int = 0, pad: int = 10, psm: int | None = None,
              oem: int | None = None, **_):
        """
        Enmascara texto detectado por OCR pintándolo en blanco.
        - min_conf: confianza mínima (Tesseract suele dar -1 cuando no hay texto).
        - pad: padding alrededor del bbox.
        - psm/oem: opcionales para ajustar el modo de segmentación/engine.
        """
        if not enabled:
            return img

        config_parts = []
        if psm is not None:
            config_parts.append(f"--psm {int(psm)}")
        if oem is not None:
            config_parts.append(f"--oem {int(oem)}")
        config = " ".join(config_parts) if config_parts else ""

        data = pytesseract.image_to_data(
            img, lang=lang, config=config, output_type=pytesseract.Output.DICT
        )

        out = img.copy()
        n = len(data.get("text", []))

        # Asegurar longitudes y defaults
        lefts   = data.get("left",   [0] * n)
        tops    = data.get("top",    [0] * n)
        widths  = data.get("width",  [0] * n)
        heights = data.get("height", [0] * n)
        confs   = data.get("conf",   [-1] * n)
        texts   = data.get("text",   [""] * n)

        H, W = out.shape[:2]
        for i in range(n):
            conf = _to_int_conf(confs[i])
            if conf < int(min_conf):
                continue
            text = texts[i]
            if text is None or str(text).strip() == "":
                continue

            x  = _to_int(lefts[i])
            y  = _to_int(tops[i])
            w  = _to_int(widths[i])
            h  = _to_int(heights[i])

            x0 = max(0, x - pad)
            y0 = max(0, y - pad)
            x1 = min(W, x + w + pad)
            y1 = min(H, y + h + pad)

            if x0 < x1 and y0 < y1:
                cv2.rectangle(out, (x0, y0), (x1, y1), 255, -1)

        return out
