from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, cards, dashboard, watchlist, admin

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CardAlpha API",
    description="Trading card investment analytics platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(dashboard.router)
app.include_router(watchlist.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "CardAlpha API"}


@app.on_event("startup")
def on_startup():
    """Seed database on startup."""
    db = SessionLocal()
    try:
        from app.seed_data import seed
        seed(db)
    except Exception as e:
        print(f"Seed error (may already be seeded): {e}")
    finally:
        db.close()
