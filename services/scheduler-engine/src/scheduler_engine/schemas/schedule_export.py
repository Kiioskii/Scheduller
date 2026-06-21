from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ExportGrafikPdfRequest(BaseModel):
    preview: dict[str, Any]

    model_config = {"populate_by_name": True}


class ExportGrafikPdfResponse(BaseModel):
    file_name: str = Field(alias="fileName")
    content_base64: str = Field(alias="contentBase64")

    model_config = {"populate_by_name": True, "by_alias": True}
