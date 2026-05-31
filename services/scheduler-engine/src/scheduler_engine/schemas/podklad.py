from pydantic import BaseModel, Field


class PodkladTemplateQuery(BaseModel):
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
