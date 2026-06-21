"""Color detection for podkład disposition cells."""

from __future__ import annotations

from typing import Literal

from openpyxl.cell.cell import Cell

FillKind = Literal["yellow", "purple", "white", "none"]

YELLOW_RGB_SUFFIXES = frozenset({"FFFF99", "FFFFFF99"})
PURPLE_RGB_SUFFIXES = frozenset({"CCCCFF", "FFCCCCFF"})
WHITE_RGB_SUFFIXES = frozenset({"FFFFFF", "FFFFFFFF"})


def _normalize_rgb(value: object | None) -> str | None:
    if value is None:
        return None
    rgb = str(value).upper().replace("#", "")
    if rgb in {"NONE", "00000000", "0"}:
        return None
    return rgb


def classify_cell_fill(cell: Cell) -> FillKind:
    fill = cell.fill
    if fill is None or fill.patternType not in {"solid", "gray125"}:
        return "none"

    rgb = _normalize_rgb(getattr(fill.fgColor, "rgb", None))
    if rgb is None:
        indexed = getattr(fill.fgColor, "indexed", None)
        if indexed == 64:
            return "white"
        return "none"

    for suffix in YELLOW_RGB_SUFFIXES:
        if rgb.endswith(suffix) or rgb == suffix:
            return "yellow"

    for suffix in PURPLE_RGB_SUFFIXES:
        if rgb.endswith(suffix) or rgb == suffix:
            return "purple"

    for suffix in WHITE_RGB_SUFFIXES:
        if rgb.endswith(suffix) or rgb == suffix:
            return "white"

    return "none"


def classify_pair_fill(left: Cell, right: Cell) -> FillKind:
    left_kind = classify_cell_fill(left)
    right_kind = classify_cell_fill(right)

    for kind in ("yellow", "purple", "white"):
        if left_kind == kind or right_kind == kind:
            return kind

    return "none"
