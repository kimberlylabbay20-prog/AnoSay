from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.report_controller import (
    create_report,
    get_all_reports,
    get_report_by_id,
    update_report_status,
)
from app.database import get_db
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse, ReportStatusUpdate
from app.security import require_admin

router = APIRouter(tags=["reports"])


@router.post("/stories/{story_id}/reports", response_model=ReportResponse, status_code=201)
def report_story(story_id: str, data: ReportCreate, db: Session = Depends(get_db)):
    return create_report(story_id, data, db)


@router.get("/admin/reports", response_model=list[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return get_all_reports(db)


@router.get("/admin/reports/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return get_report_by_id(report_id, db)


@router.put("/admin/reports/{report_id}", response_model=ReportResponse)
def update_status(
    report_id: int,
    data: ReportStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return update_report_status(report_id, data, db)