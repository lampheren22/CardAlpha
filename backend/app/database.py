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

# SQLAlchemy requires "postgresql://" not "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Neon requires SSL
connect_args = {}
if "neon.tech" in DATABASE_URL:
    if "sslmode" not in DATABASE_URL:
        DATABASE_URL += "?sslmode=require"
    connect_args = {"sslmode": "require"}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,        # detect stale connections
    pool_size=1,               # serverless: keep pool small
    max_overflow=0,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
