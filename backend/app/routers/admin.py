from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.card import Card
from app.models.market_data import MarketData
from app.schemas.user import UserResponse, UserTierUpdate
from app.schemas.card import CardResponse, MarketDataResponse
from app.auth import get_current_admin_user
from app.routers.cards import _enrich_card

router = APIRouter(prefix="/admin", tags=["admin"])

SCORING_WEIGHTS = {
    "below_90d_avg": 25,
    "below_ath": 20,
    "volume_momentum": 15,
    "rookie_status": 10,
    "low_population": 10,
    "serial_scarcity": 10,
    "performance_momentum": 5,
    "set_popularity": 5,
}


# ── Schemas ───────────────────────────────────────────────────────────

class CardWithMarketCreate(BaseModel):
    # Card fields
    sport: str
    player_name: str
    set_name: str
    card_number: Optional[str] = None
    parallel_type: Optional[str] = None
    is_graded: bool = False
    grade_company: Optional[str] = None
    grade: Optional[str] = None
    population: Optional[int] = None
    is_rookie: bool = False
    serial_number: Optional[int] = None
    print_run: Optional[int] = None
    image_url: Optional[str] = None
    # Market data fields
    current_price: float
    price_7d_avg: Optional[float] = None
    price_30d_avg: Optional[float] = None
    price_90d_avg: Optional[float] = None
    price_ath: Optional[float] = None
    price_atl: Optional[float] = None
    sales_volume_7d: int = 0
    sales_volume_14d: int = 0
    sales_volume_30d: int = 0
    sell_through_rate: float = 0.0
    avg_days_to_sell: Optional[float] = None
    sales_per_week: Optional[float] = None


class CardWithMarketUpdate(CardWithMarketCreate):
    pass


# ── Card management ───────────────────────────────────────────────────

@router.get("/cards", response_model=List[CardResponse])
def admin_list_cards(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    cards = db.query(Card).order_by(Card.id.desc()).all()
    return [_enrich_card(c, db.query(MarketData).filter(MarketData.card_id == c.id).first()) for c in cards]


@router.post("/cards", response_model=CardResponse, status_code=201)
def admin_create_card(
    data: CardWithMarketCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = Card(
        sport=data.sport,
        player_name=data.player_name,
        set_name=data.set_name,
        card_number=data.card_number,
        parallel_type=data.parallel_type,
        is_graded=data.is_graded,
        grade_company=data.grade_company,
        grade=data.grade,
        population=data.population,
        is_rookie=data.is_rookie,
        serial_number=data.serial_number,
        print_run=data.print_run,
        image_url=data.image_url,
    )
    db.add(card)
    db.flush()

    md = MarketData(
        card_id=card.id,
        current_price=data.current_price,
        price_7d_avg=data.price_7d_avg,
        price_30d_avg=data.price_30d_avg,
        price_90d_avg=data.price_90d_avg,
        price_ath=data.price_ath,
        price_atl=data.price_atl,
        sales_volume_7d=data.sales_volume_7d,
        sales_volume_14d=data.sales_volume_14d,
        sales_volume_30d=data.sales_volume_30d,
        sell_through_rate=data.sell_through_rate,
        avg_days_to_sell=data.avg_days_to_sell,
        sales_per_week=data.sales_per_week,
        price_history=[],
        last_updated=datetime.utcnow(),
    )
    db.add(md)
    db.commit()
    db.refresh(card)
    db.refresh(md)
    return _enrich_card(card, md)


@router.put("/cards/{card_id}", response_model=CardResponse)
def admin_update_card(
    card_id: int,
    data: CardWithMarketUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    for field in ["sport", "player_name", "set_name", "card_number", "parallel_type",
                  "is_graded", "grade_company", "grade", "population", "is_rookie",
                  "serial_number", "print_run", "image_url"]:
        setattr(card, field, getattr(data, field))

    md = db.query(MarketData).filter(MarketData.card_id == card_id).first()
    if not md:
        md = MarketData(card_id=card_id, price_history=[])
        db.add(md)

    for field in ["current_price", "price_7d_avg", "price_30d_avg", "price_90d_avg",
                  "price_ath", "price_atl", "sales_volume_7d", "sales_volume_14d",
                  "sales_volume_30d", "sell_through_rate", "avg_days_to_sell", "sales_per_week"]:
        setattr(md, field, getattr(data, field))
    md.last_updated = datetime.utcnow()

    db.commit()
    db.refresh(card)
    db.refresh(md)
    return _enrich_card(card, md)


@router.delete("/cards/{card_id}")
def admin_delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    md = db.query(MarketData).filter(MarketData.card_id == card_id).first()
    if md:
        db.delete(md)
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}


# ── Price history append ───────────────────────────────────────────────

class PriceEntry(BaseModel):
    date: str  # YYYY-MM-DD
    price: float
    volume: int = 0


@router.post("/cards/{card_id}/price-history")
def add_price_entry(
    card_id: int,
    entry: PriceEntry,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    md = db.query(MarketData).filter(MarketData.card_id == card_id).first()
    if not md:
        raise HTTPException(status_code=404, detail="Market data not found")
    history = list(md.price_history or [])
    history.append({"date": entry.date, "price": entry.price, "volume": entry.volume})
    history.sort(key=lambda x: x["date"])
    md.price_history = history
    md.current_price = entry.price
    md.last_updated = datetime.utcnow()
    db.commit()
    return {"message": "Price entry added", "total_entries": len(history)}


# ── Users ──────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    return db.query(User).all()


@router.put("/users/{user_id}/tier", response_model=UserResponse)
def update_user_tier(
    user_id: int,
    data: UserTierUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.tier not in ("free", "pro"):
        raise HTTPException(status_code=400, detail="Tier must be 'free' or 'pro'")
    user.tier = data.tier
    db.commit()
    db.refresh(user)
    return user


# ── Scoring weights ───────────────────────────────────────────────────

@router.get("/scoring-weights")
def get_scoring_weights(admin: User = Depends(get_current_admin_user)):
    return SCORING_WEIGHTS


@router.put("/scoring-weights")
def update_scoring_weights(
    weights: dict,
    admin: User = Depends(get_current_admin_user),
):
    valid_keys = set(SCORING_WEIGHTS.keys())
    for key in weights:
        if key not in valid_keys:
            raise HTTPException(status_code=400, detail=f"Invalid weight key: {key}")
    SCORING_WEIGHTS.update(weights)
    return SCORING_WEIGHTS


# ── Stats ─────────────────────────────────────────────────────────────

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    from app.models.watchlist import WatchlistItem, PortfolioItem
    return {
        "total_cards": db.query(Card).count(),
        "total_users": db.query(User).count(),
        "pro_users": db.query(User).filter(User.tier == "pro").count(),
        "watchlist_items": db.query(WatchlistItem).count(),
        "portfolio_items": db.query(PortfolioItem).count(),
        "mlb_cards": db.query(Card).filter(Card.sport == "MLB").count(),
        "nfl_cards": db.query(Card).filter(Card.sport == "NFL").count(),
        "pokemon_cards": db.query(Card).filter(Card.sport == "Pokemon").count(),
    }
