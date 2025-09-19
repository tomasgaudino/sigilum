from __future__ import annotations
import cv2, numpy as np, time
from sigilum.phases.base import PhaseBase, register_phase
from sigilum.utils.logger import get_logger

def _to_binary(img: np.ndarray, thr: int = 127) -> np.ndarray:
    """Devuelve binaria 0/255."""
    if img.dtype != np.uint8:
        img = img.astype("uint8")
    # si ya parece binaria, no tocar
    if (img.max() in (1, 255)) and (np.unique(img).size <= 3):
        return (img > 0).astype("uint8") * 255
    _, bw = cv2.threshold(img, thr, 255, cv2.THRESH_BINARY)
    return bw

@register_phase
class SkeletonizationPhase(PhaseBase):
    """
    Métodos disponibles:
      - method="skimage"    (rápido y estable; requiere scikit-image)
      - method="morph"      (morfología iterativa con guardas)
      - method="ximgproc"   (si está opencv-contrib; se usa Zhang-Suen)
    Guardas:
      - max_iter: corta lazos largos (solo morph)
      - max_ms:   timeout duro (todos)
    Tips de performance:
      - resize_before=True y size=(w,h) para procesar menos píxeles
    """
    def apply(
        self,
        img,
        enabled: bool = True,
        method: str = "skimage",
        resize_before: bool = True,
        size: tuple[int, int] = (256, 256),
        max_iter: int = 1000,
        log_every: int = 50,
        max_ms: int = 3000,
        **_,
    ):
        log = get_logger()
        if not enabled:
            return img

        t0 = time.perf_counter()
        # preparar imagen (binaria + opcionalmente reducir)
        work = _to_binary(img)
        if resize_before and (work.shape[1], work.shape[0]) != size:
            work = cv2.resize(work, size, interpolation=cv2.INTER_AREA)

        method = (method or "skimage").lower()

        try:
            if method == "ximgproc" and hasattr(cv2, "ximgproc"):
                # Zhang–Suen thinning (muy rápido si está disponible)
                bw = (work > 0).astype("uint8") * 255
                skel = cv2.ximgproc.thinning(bw, thinningType=cv2.ximgproc.THINNING_ZHANGSUEN)
                dt = (time.perf_counter() - t0) * 1000
                log.debug(f"[Skeletonize] ximgproc {bw.shape} → {dt:.1f} ms")
                return skel
        except Exception:
            # si falla, caemos a skimage/morph
            pass

        if method == "skimage":
            try:
                from skimage.morphology import skeletonize as sk_skel
                bw_bool = (work > 0)
                sk = sk_skel(bw_bool).astype("uint8") * 255
                dt = (time.perf_counter() - t0) * 1000
                log.debug(f"[Skeletonize] skimage {work.shape} → {dt:.1f} ms")
                return sk
            except Exception as e:
                log.warning(f"[Skeletonize] skimage no disponible ({e}), usando 'morph'")

        # Fallback: morfología iterativa con guardas
        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        bw = (work > 0).astype("uint8") * 255
        size_total = bw.size
        skel = np.zeros_like(bw)
        iter_count = 0

        while True:
            t_iter = time.perf_counter()
            opened = cv2.morphologyEx(bw, cv2.MORPH_OPEN, element)
            temp = cv2.subtract(bw, opened)
            skel = cv2.bitwise_or(skel, temp)
            eroded = cv2.erode(bw, element)
            bw = eroded

            iter_count += 1
            if iter_count % max(1, log_every) == 0:
                nonzero = int(cv2.countNonZero(bw))
                elapsed = (time.perf_counter() - t0) * 1000
                log.debug(f"[Skeletonize] morph iter={iter_count} remaining={nonzero} elapsed={elapsed:.1f} ms")

            # condiciones de corte
            if cv2.countNonZero(bw) == 0:
                break
            if max_iter and iter_count >= max_iter:
                log.warning(f"[Skeletonize] morph max_iter={max_iter} alcanzado; cortando")
                break
            if max_ms and (time.perf_counter() - t0) * 1000 >= max_ms:
                log.warning(f"[Skeletonize] morph timeout {max_ms} ms; cortando")
                break

            # pequeño guard por cambios nulos
            if (time.perf_counter() - t_iter) * 1000 < 0.05:
                # si la iteración no produjo cambios significativos en tiempo, continuar igual
                pass

        dt = (time.perf_counter() - t0) * 1000
        log.debug(f"[Skeletonize] morph {work.shape} iters={iter_count} → {dt:.1f} ms")
        return skel
