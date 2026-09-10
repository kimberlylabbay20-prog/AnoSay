from fastapi import APIRouter, Depends

from app.controllers.admin_controller import get_dashboard_data
from app.models.user import User
from app.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def dashboard(admin: User = Depends(require_admin)):
    return get_dashboard_data(admin)