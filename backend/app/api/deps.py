from typing import Generator
from app.core.database import SessionLocal

def get_db() -> Generator:
    """
    FastAPI database dependency.
    Yields a new database session per request and cleans it up after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
