from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class ReportStatusUpdate(BaseModel):
    status: Literal["pending", "reviewed", "dismissed"]


class ReportResponse(BaseModel):
    id: int
    story_id: str
    reason: str
    status: str
    created_at: datetime