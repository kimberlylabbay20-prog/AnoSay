from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.controllers.category_controller import (
    create_category,
    delete_category,
    get_all_categories,
    get_category_by_id,
    update_category,
)
from app.database import get_db
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse
from app.security import require_admin

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return get_all_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return get_category_by_id(category_id, db)


@router.post("/", response_model=CategoryResponse, status_code=201)
def create(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return create_category(data, db)


@router.put("/{category_id}", response_model=CategoryResponse)
def update(
    category_id: int,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return update_category(category_id, data, db)


@router.delete("/{category_id}")
def delete(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return delete_category(category_id, db)