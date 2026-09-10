from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_postgres_url

engine = create_engine(get_postgres_url())
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_postgres():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
