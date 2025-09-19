from .base import PhaseBase, register_phase, get_phase_cls
from .autoresize import AutoResizePhase
from .deskew import DeskewBorderPhase
from .border import BorderBlurPhase
from .illumination import IlluminationPhase
from .color import ColorSelectPhase
from .denoise import DenoisePhase
from .binarization import BinarizationPhase
from .morphology import MorphologyPhase
from .ocr import OCRMaskPhase
from .lines_boxes import RemoveLinesBoxesPhase
from .candidate import CandidatePhase
from .skeletonize import SkeletonizationPhase
from .autocrop import AutoCropPhase
