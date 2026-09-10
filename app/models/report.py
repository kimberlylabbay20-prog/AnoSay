from sqlalchemy import Column, DateTime, Integer, String, Text, func
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(String(50), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, server_default=func.now())
