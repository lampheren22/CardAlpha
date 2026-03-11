from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, cards, dashboard, watchlist, admin

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
    """Create all tables on startup. No seed data — use admin panel to add cards."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init warning: {e}")
