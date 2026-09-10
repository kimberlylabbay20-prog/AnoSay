from app.database import Base, engine
from app.models import User, Category, Report


def init_postgres_tables():
    Base.metadata.create_all(bind=engine)
