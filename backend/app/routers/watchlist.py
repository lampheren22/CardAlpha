from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.watchlist import WatchlistItem, PortfolioItem
from app.models.card import Card
from app.models.market_data import MarketData
from app.models.user import User
from app.schemas.watchlist import (
    WatchlistItemCreate,
    WatchlistItemResponse,
    PortfolioItemCreate,
    PortfolioItemResponse,
    PortfolioSummary,
)
from app.auth import require_current_user
from app.services.scoring import calculate_alpha_score
from app.services.projection import calculate_projection
from app.routers.cards import _enrich_card

router = APIRouter(tags=["watchlist"])


def _card_response(card, db):
    md = db.query(MarketData).filter(MarketData.card_id == card.id).first()
    return _enrich_card(card, md)


@router.get("/watchlist", response_model=List[WatchlistItemResponse])
def get_watchlist(
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()
    result = []
    for item in items:
        card = db.query(Card).filter(Card.id == item.card_id).first()
        result.append(
            {
                "id": item.id,
                "card_id": item.card_id,
                "card": _card_response(card, db) if card else None,
                "added_at": item.added_at,
            }
        )
    return result


@router.post("/watchlist", response_model=WatchlistItemResponse)
def add_to_watchlist(
    data: WatchlistItemCreate,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    exists = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == current_user.id, WatchlistItem.card_id == data.card_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Card already in watchlist")
    item = WatchlistItem(user_id=current_user.id, card_id=data.card_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    card = db.query(Card).filter(Card.id == data.card_id).first()
    return {
        "id": item.id,
        "card_id": item.card_id,
        "card": _card_response(card, db) if card else None,
        "added_at": item.added_at,
    }


@router.delete("/watchlist/{item_id}")
def remove_from_watchlist(
    item_id: int,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.id == item_id, WatchlistItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}


@router.get("/portfolio", response_model=List[PortfolioItemResponse])
def get_portfolio(
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(PortfolioItem).filter(PortfolioItem.user_id == current_user.id).all()
    result = []
    for item in items:
        card = db.query(Card).filter(Card.id == item.card_id).first()
        card_data = _card_response(card, db) if card else None
        current_value = (card_data.get("current_price") or 0) * item.quantity if card_data else 0
        total_cost = item.purchase_price * item.quantity
        unrealized_gain = current_value - total_cost
        unrealized_gain_pct = (unrealized_gain / total_cost * 100) if total_cost > 0 else 0
        result.append(
            {
                "id": item.id,
                "card_id": item.card_id,
                "card": card_data,
                "purchase_price": item.purchase_price,
                "purchase_date": item.purchase_date,
                "quantity": item.quantity,
                "notes": item.notes,
                "current_value": round(current_value, 2),
                "unrealized_gain": round(unrealized_gain, 2),
                "unrealized_gain_pct": round(unrealized_gain_pct, 1),
                "added_at": item.added_at,
            }
        )
    return result


@router.post("/portfolio", response_model=PortfolioItemResponse)
def add_to_portfolio(
    data: PortfolioItemCreate,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    item = PortfolioItem(
        user_id=current_user.id,
        card_id=data.card_id,
        purchase_price=data.purchase_price,
        purchase_date=data.purchase_date or datetime.utcnow(),
        quantity=data.quantity,
        notes=data.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    card = db.query(Card).filter(Card.id == data.card_id).first()
    card_data = _card_response(card, db) if card else None
    current_value = (card_data.get("current_price") or 0) * item.quantity if card_data else 0
    total_cost = item.purchase_price * item.quantity
    unrealized_gain = current_value - total_cost
    unrealized_gain_pct = (unrealized_gain / total_cost * 100) if total_cost > 0 else 0
    return {
        "id": item.id,
        "card_id": item.card_id,
        "card": card_data,
        "purchase_price": item.purchase_price,
        "purchase_date": item.purchase_date,
        "quantity": item.quantity,
        "notes": item.notes,
        "current_value": round(current_value, 2),
        "unrealized_gain": round(unrealized_gain, 2),
        "unrealized_gain_pct": round(unrealized_gain_pct, 1),
        "added_at": item.added_at,
    }


@router.delete("/portfolio/{item_id}")
def remove_from_portfolio(
    item_id: int,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(PortfolioItem).filter(
        PortfolioItem.id == item_id, PortfolioItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed from portfolio"}


@router.get("/portfolio/summary", response_model=PortfolioSummary)
def get_portfolio_summary(
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    items = db.query(PortfolioItem).filter(PortfolioItem.user_id == current_user.id).all()
    total_invested = 0.0
    current_value = 0.0
    for item in items:
        card = db.query(Card).filter(Card.id == item.card_id).first()
        card_data = _card_response(card, db) if card else None
        cost = item.purchase_price * item.quantity
        total_invested += cost
        val = (card_data.get("current_price") or 0) * item.quantity if card_data else cost
        current_value += val
    total_gain = current_value - total_invested
    total_gain_pct = (total_gain / total_invested * 100) if total_invested > 0 else 0
    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "total_gain": round(total_gain, 2),
        "total_gain_pct": round(total_gain_pct, 1),
        "num_positions": len(items),
    }
