from datetime import datetime

from pydantic import BaseModel, Field


class StoryCreate(BaseModel):
    title: str = Field(..., max_length=150)
    content: str
    category: str
    tags: list[str] = Field(default_factory=list)


class StoryResponse(BaseModel):
    id: str
    title: str
    content: str
    category: str
    tags: list[str]
    status: str
    created_at: datetime
