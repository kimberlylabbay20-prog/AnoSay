from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse


def _serialize(category: Category) -> CategoryResponse:
    return CategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description,
    )


def create_category(data: CategoryCreate, db: Session) -> CategoryResponse:
    category = Category(name=data.name, description=data.description)
    db.add(category)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists")
    db.refresh(category)
    return _serialize(category)


def get_all_categories(db: Session) -> list[CategoryResponse]:
    categories = db.query(Category).order_by(Category.id.asc()).all()
    return [_serialize(category) for category in categories]


def get_category_by_id(category_id: int, db: Session) -> CategoryResponse:
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return _serialize(category)


def update_category(category_id: int, data: CategoryCreate, db: Session) -> CategoryResponse:
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    category.name = data.name
    category.description = data.description
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category name already exists")
    db.refresh(category)
    return _serialize(category)


def delete_category(category_id: int, db: Session) -> dict:
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}