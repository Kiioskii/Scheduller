"""Generate schedule podkład xlsx from styled template."""

from __future__ import annotations

import calendar
import io
from copy import copy
from datetime import date
from importlib.resources import files

from openpyxl import load_workbook
from openpyxl.worksheet.worksheet import Worksheet

MONTH_UPPER = (
    "STYCZEŃ",
    "LUTY",
    "MARZEC",
    "KWIECIEŃ",
    "MAJ",
    "CZERWIEC",
    "LIPIEC",
    "SIERPIEŃ",
    "WRZESIEŃ",
    "PAŹDZIERNIK",
    "LISTOPAD",
    "GRUDZIEŃ",
)

WEEKDAY_LABELS = ("Niedz.", "Pon.", "Wt.", "Śr.", "Czw.", "Pt.", "Sob.")

TEMPLATE_DAYS = 30


def get_days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]


def format_podklad_file_name(year: int, month: int) -> str:
    days = get_days_in_month(year, month)
    mm = f"{month:02d}"
    last = f"{days:02d}.{mm}"
    return f"PODKŁAD 01.{mm}-{last} R.xlsx"


def weekday_label(year: int, month: int, day: int) -> str:
    weekday = date(year, month, day).weekday()  # Mon=0 … Sun=6
    index = (weekday + 1) % 7  # align with JS Date.getDay() (Sun=0)
    return WEEKDAY_LABELS[index]


def day_weekday_col(day: int) -> int:
    """1-based column for weekday label and day number (merged pair starts here)."""
    return 2 * day + 1


def name_block_col(days_in_month: int) -> int:
    """1-based column for right-side 'nazwisko'."""
    return 2 + 2 * days_in_month + 1


def _copy_cell_style(source, target) -> None:
    if source.has_style:
        target.font = copy(source.font)
        target.fill = copy(source.fill)
        target.border = copy(source.border)
        target.alignment = copy(source.alignment)
        target.number_format = copy(source.number_format)
        target.protection = copy(source.protection)


def _copy_column_pair(ws: Worksheet, src_col: int, dst_col: int, max_row: int) -> None:
    for row in range(1, max_row + 1):
        for offset in range(2):
            src = ws.cell(row, src_col + offset)
            dst = ws.cell(row, dst_col + offset)
            dst.value = src.value
            _copy_cell_style(src, dst)
    for offset in range(2):
        letter_src = ws.cell(1, src_col + offset).column_letter
        letter_dst = ws.cell(1, dst_col + offset).column_letter
        dim_src = ws.column_dimensions[letter_src]
        dim_dst = ws.column_dimensions[letter_dst]
        dim_dst.width = dim_src.width
        dim_dst.hidden = dim_src.hidden


def _trim_extra_days(ws: Worksheet, days_in_month: int) -> None:
    for day in range(TEMPLATE_DAYS, days_in_month, -1):
        ws.delete_cols(day_weekday_col(day), 2)


def _append_extra_days(ws: Worksheet, days_in_month: int) -> None:
    insert_at = name_block_col(TEMPLATE_DAYS)
    for day in range(TEMPLATE_DAYS + 1, days_in_month + 1):
        ws.insert_cols(insert_at, 2)
        src_col = day_weekday_col(day - 1)
        _copy_column_pair(ws, src_col, insert_at, ws.max_row)
        insert_at += 2


def _fill_calendar(ws: Worksheet, year: int, month: int, days_in_month: int) -> None:
    title = f"{MONTH_UPPER[month - 1]} {year}"
    ws.cell(1, 1).value = title

    for day in range(1, days_in_month + 1):
        col = day_weekday_col(day)
        ws.cell(1, col).value = weekday_label(year, month, day)
        ws.cell(2, col).value = day

    name_col = name_block_col(days_in_month)
    ws.cell(3, name_col).value = "nazwisko"
    ws.cell(3, name_col + 1).value = "imię"


def _template_path():
    return files("scheduler_engine").joinpath("assets/podklad_template.xlsx")


def generate_podklad_workbook(year: int, month: int):
    if month < 1 or month > 12:
        raise ValueError("month must be 1–12")
    if year < 2000 or year > 2100:
        raise ValueError("year out of range")

    days_in_month = get_days_in_month(year, month)
    print("days_in_month ",days_in_month)

    with _template_path().open("rb") as template_file:
        workbook = load_workbook(template_file)
    worksheet = workbook.active

    if days_in_month < TEMPLATE_DAYS:
        _trim_extra_days(worksheet, days_in_month)
    elif days_in_month > TEMPLATE_DAYS:
        _append_extra_days(worksheet, days_in_month)

    _fill_calendar(worksheet, year, month, days_in_month)
    return workbook


def generate_podklad_bytes(year: int, month: int) -> bytes:
    workbook = generate_podklad_workbook(year, month)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
