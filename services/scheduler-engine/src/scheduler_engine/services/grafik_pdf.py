"""Render schedule preview grid to PDF (landscape, similar to reference grafik files)."""

from __future__ import annotations

import io
from typing import Literal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from scheduler_engine.services.podklad_generator import MONTH_UPPER
from scheduler_engine.services.schedule_preview import SchedulePreview

FILL_COLORS: dict[str, colors.Color] = {
    "yellow": colors.HexColor("#FFFF99"),
    "purple": colors.HexColor("#CCCCFF"),
}


def _draw_cell(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
    text: str | None,
    fill: Literal["none", "yellow", "purple"],
) -> None:
    if fill != "none":
        pdf.setFillColor(FILL_COLORS[fill])
        pdf.rect(x, y, width, height, stroke=0, fill=1)

    pdf.setFillColor(colors.black)
    pdf.setStrokeColor(colors.grey)
    pdf.rect(x, y, width, height, stroke=0.5, fill=0)

    if text:
        pdf.setFont("Helvetica", 6)
        pdf.drawCentredString(x + width / 2, y + height / 2 - 2, text)


def render_grafik_pdf(preview: SchedulePreview) -> bytes:
    buffer = io.BytesIO()
    page_width, page_height = landscape(A3)
    pdf = canvas.Canvas(buffer, pagesize=landscape(A3))

    margin = 8 * mm
    title_height = 10 * mm
    header_height = 6 * mm
    name_col_width = 18 * mm
    day_pair_width = 9 * mm
    cell_height = 5 * mm

    days = preview.days_in_month
    grid_width = days * day_pair_width * 2
    total_width = name_col_width * 2 + grid_width + name_col_width * 2

    scale = min(1.0, (page_width - 2 * margin) / total_width)
    name_col_width *= scale
    day_pair_width *= scale
    cell_height *= scale
    header_height *= scale
    grid_width = days * day_pair_width * 2
    total_width = name_col_width * 2 + grid_width + name_col_width * 2
    start_x = margin + max(0, (page_width - 2 * margin - total_width) / 2)

    title = f"GRAFIK {MONTH_UPPER[preview.month - 1]} {preview.year}"
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(start_x, page_height - margin, title)

    y = page_height - margin - title_height

    def day_x(day_index: int, half: int) -> float:
        return start_x + name_col_width * 2 + day_index * day_pair_width * 2 + half * day_pair_width

    pdf.setFont("Helvetica", 5)
    for day_index in range(days):
        weekday = preview.weekdays[day_index]
        day_num = str(preview.day_numbers[day_index])
        x0 = day_x(day_index, 0)
        pdf.drawCentredString(x0 + day_pair_width, y - header_height / 2, weekday)
        pdf.drawCentredString(x0 + day_pair_width, y - header_height - cell_height / 2, day_num)

    y -= header_height + cell_height

    pdf.setFont("Helvetica-Bold", 6)
    pdf.drawString(start_x, y - cell_height / 2, "nazwisko")
    pdf.drawString(start_x + name_col_width, y - cell_height / 2, "imię")
    right_name_x = start_x + name_col_width * 2 + grid_width
    pdf.drawString(right_name_x, y - cell_height / 2, "nazwisko")
    pdf.drawString(right_name_x + name_col_width, y - cell_height / 2, "imię")
    y -= cell_height

    for worker in preview.workers:
        block_height = len(worker.rows) * cell_height
        if y - block_height < margin:
            pdf.showPage()
            y = page_height - margin

        for row_index, row in enumerate(worker.rows):
            row_y = y - (row_index + 1) * cell_height
            if row_index == 0:
                pdf.setFont("Helvetica", 6)
                pdf.drawString(start_x + 1, row_y + cell_height / 2 - 2, worker.last_name)
                pdf.drawString(start_x + name_col_width + 1, row_y + cell_height / 2 - 2, worker.first_name)
                pdf.drawString(right_name_x + 1, row_y + cell_height / 2 - 2, worker.last_name)
                pdf.drawString(
                    right_name_x + name_col_width + 1,
                    row_y + cell_height / 2 - 2,
                    worker.first_name,
                )

            for day_index, cell in enumerate(row):
                _draw_cell(
                    pdf,
                    day_x(day_index, 0),
                    row_y,
                    day_pair_width,
                    cell_height,
                    cell.start.text,
                    cell.start.fill,
                )
                _draw_cell(
                    pdf,
                    day_x(day_index, 1),
                    row_y,
                    day_pair_width,
                    cell_height,
                    cell.end.text,
                    cell.end.fill,
                )

        y -= block_height

    pdf.save()
    return buffer.getvalue()
