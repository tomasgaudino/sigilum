from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, Type

# Registro global de fases
_PHASE_REGISTRY: Dict[str, Type["PhaseBase"]] = {}

def register_phase(cls: Type["PhaseBase"]) -> Type["PhaseBase"]:
    name = cls.__name__.replace("Phase", "")
    _PHASE_REGISTRY[name] = cls
    return cls

def get_phase_cls(name: str) -> Type["PhaseBase"]:
    if name in _PHASE_REGISTRY:
        return _PHASE_REGISTRY[name]
    # permitir uso con sufijo "Phase"
    if name.endswith("Phase") and name[:-5] in _PHASE_REGISTRY:
        return _PHASE_REGISTRY[name[:-5]]
    raise KeyError(f"Phase '{name}' no registrada. Registradas: {list(_PHASE_REGISTRY)}")

class PhaseBase(ABC):
    """Contrato mínimo para una fase pura (input -> output)."""

    @property
    def name(self) -> str:
        return self.__class__.__name__.replace("Phase", "")

    @property
    def defaults(self) -> Dict[str, Any]:
        return {}

    @abstractmethod
    def apply(self, img, **params):
        """Aplica la operación y devuelve imagen."""
        ...
