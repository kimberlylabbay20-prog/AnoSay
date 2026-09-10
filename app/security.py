from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.config import JWT_SECRET
from app.database import get_db
from app.models.user import User

password_hasher = PasswordHash.recommended()

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using Argon2."""
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a hash."""
    return password_hasher.verify(password, password_hash)


def create_access_token(user: User, expires_minutes: int = TOKEN_EXPIRE_MINUTES) -> str:
    """Create a signed JWT for the given user."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": str(user.id),
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    """Verify the token signature/expiration and return the user id from 'sub'."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Return the authenticated User from PostgreSQL, or raise HTTP 401."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Return the authenticated User only if they are an admin, else HTTP 403."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user