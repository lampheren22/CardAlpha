import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Vercel Neon injects POSTGRES_URL; fallback to DATABASE_URL for local dev
DATABASE_URL = (
    os.getenv("POSTGRES_URL")
    or os.getenv("DATABASE_URL")
    or "postgresql://postgres:postgres@localhost:5432/cardalpha"
)

# Neon requires SSL — ensure it's in the URL and pass connect_args
if "neon.tech" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

connect_args = {"sslmode": "require"} if "neon.tech" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
