from io import BytesIO

from openpyxl import load_workbook

from scheduler_engine.services.podklad_generator import (
    format_podklad_file_name,
    generate_podklad_bytes,
    get_days_in_month,
    weekday_label,
)


def test_format_podklad_file_name() -> None:
    assert format_podklad_file_name(2026, 6) == "PODKŁAD 01.06-30.06 R.xlsx"
    assert get_days_in_month(2026, 2) == 28
    assert format_podklad_file_name(2026, 2) == "PODKŁAD 01.02-28.02 R.xlsx"


def test_weekday_label_matches_js_convention() -> None:
    assert weekday_label(2026, 6, 1) == "Pon."


def test_june_layout_matches_template_structure() -> None:
    content = generate_podklad_bytes(2026, 6)
    ws = load_workbook(BytesIO(content)).active

    assert ws.cell(1, 1).value == "CZERWIEC 2026"
    assert ws.cell(1, 3).value == "Pon."
    assert ws.cell(2, 3).value == 1
    assert ws.cell(2, 61).value == 30
    assert ws.cell(3, 1).value == "nazwisko"
    assert ws.cell(3, 2).value == "imię"
    assert ws.cell(9, 2).value == "RANO"
    assert ws.cell(11, 2).value == "POPOŁUDNIE"
    assert ws.cell(15, 2).value == "PRZEDZIAŁ"
    assert ws.cell(15, 4).value == 13
    assert ws.cell(15, 5).value == 22
    assert len(ws.merged_cells.ranges) >= 35


def test_february_has_28_days() -> None:
    content = generate_podklad_bytes(2026, 2)
    ws = load_workbook(BytesIO(content)).active

    assert ws.cell(1, 1).value == "LUTY 2026"
    assert ws.cell(2, 57).value == 28
    assert ws.cell(2, 59).value is None
