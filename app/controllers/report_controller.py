from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.controllers.story_controller import parse_story_id
from app.models.report import Report
from app.mongo import get_mongo
from app.schemas.report import ReportCreate, ReportResponse, ReportStatusUpdate


def _serialize(report: Report) -> ReportResponse:
    return ReportResponse(
        id=report.id,
        story_id=report.story_id,
        reason=report.reason,
        status=report.status,
        created_at=report.created_at,
    )


def create_report(story_id: str, data: ReportCreate, db: Session) -> ReportResponse:
    object_id = parse_story_id(story_id)

    story = get_mongo().stories.find_one({"_id": object_id})
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    report = Report(story_id=story_id, reason=data.reason, status="pending")
    db.add(report)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal error occurred")
    db.refresh(report)
    return _serialize(report)


def get_all_reports(db: Session) -> list[ReportResponse]:
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [_serialize(report) for report in reports]


def get_report_by_id(report_id: int, db: Session) -> ReportResponse:
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return _serialize(report)


def update_report_status(
    report_id: int,
    data: ReportStatusUpdate,
    db: Session,
) -> ReportResponse:
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = data.status
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="An internal error occurred")
    db.refresh(report)
    return _serialize(report)