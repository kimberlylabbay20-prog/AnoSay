from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password


def register_user(data: RegisterRequest, db: Session) -> dict:
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "created_at": user.created_at,
    }


def login_user(data: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(access_token=create_access_token(user), token_type="bearer")