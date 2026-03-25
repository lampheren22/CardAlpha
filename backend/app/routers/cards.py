from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.card import Card
from app.models.market_data import MarketData
from app.models.user import User
from app.schemas.card import (
    CardCreate,
    CardUpdate,
    CardResponse,
    CardDetailResponse,
    MarketDataCreate,
    MarketDataResponse,
    AlphaScoreBreakdown,
    ProjectionResponse,
    LiquidityResponse,
)
from app.auth import get_current_admin_user, get_current_user
from app.services.scoring import calculate_alpha_score
from app.services.projection import calculate_projection
from app.services.liquidity import calculate_liquidity
from sqlalchemy import or_

router = APIRouter(prefix="/cards", tags=["cards"])


def _build_reasoning(card, md, alpha: dict) -> str:
    """Generate a human-readable buy-signal explanation from card/market data."""
    reasons = []
    if md.price_90d_avg and md.price_90d_avg > 0 and md.current_price < md.price_90d_avg * 0.95:
        pct = (md.price_90d_avg - md.current_price) / md.price_90d_avg * 100
        reasons.append(f"{pct:.0f}% below 90D avg")
    if md.price_30d_avg and md.price_30d_avg > 0 and md.current_price < md.price_30d_avg * 0.95:
        pct = (md.price_30d_avg - md.current_price) / md.price_30d_avg * 100
        reasons.append(f"{pct:.0f}% below 30D avg")
    prior_7d = max((md.sales_volume_14d or 0) - (md.sales_volume_7d or 0), 0)
    if prior_7d > 0 and (md.sales_volume_7d or 0) > prior_7d * 1.25:
        pct = ((md.sales_volume_7d or 0) - prior_7d) / prior_7d * 100
        reasons.append(f"+{pct:.0f}% volume spike")
    if card.is_rookie:
        reasons.append("Rookie card")
    if card.population is not None and card.population < 50:
        reasons.append(f"Low pop ({card.population})")
    if card.serial_number is not None and card.serial_number <= 25:
        reasons.append(f"Serial /{card.serial_number}")
    if md.price_ath and md.price_ath > 0:
        pct_vs_ath = (md.price_ath - md.current_price) / md.price_ath * 100
        if pct_vs_ath >= 40:
            reasons.append(f"{pct_vs_ath:.0f}% below ATH")
    return " · ".join(reasons) if reasons else None


def _enrich_card(card: Card, md: Optional[MarketData]) -> dict:
    """Flatten card + market data into a response dict."""
    data = {
        "id": card.id,
        "sport": card.sport,
        "player_name": card.player_name,
        "set_name": card.set_name,
        "card_number": card.card_number,
        "parallel_type": card.parallel_type,
        "is_graded": card.is_graded,
        "grade_company": card.grade_company,
        "grade": card.grade,
        "population": card.population,
        "is_rookie": card.is_rookie,
        "serial_number": card.serial_number,
        "print_run": card.print_run,
        "image_url": card.image_url,
        "created_at": card.created_at,
    }
    if md:
        alpha = calculate_alpha_score(card, md)
        proj = calculate_projection(card, md, alpha)
        liq = calculate_liquidity(md)
        pct_vs_90d = 0.0
        if md.price_90d_avg and md.price_90d_avg > 0:
            pct_vs_90d = ((md.current_price - md.price_90d_avg) / md.price_90d_avg) * 100
        data.update(
            {
                "current_price": md.current_price,
                "price_90d_avg": md.price_90d_avg,
                "price_vs_90d_pct": round(pct_vs_90d, 1),
                "alpha_score": alpha["total"],
                "recommendation": alpha["recommendation"],
                "estimated_roi": proj["estimated_roi"],
                "risk_rating": proj["risk_rating"],
                "sell_through_rate": md.sell_through_rate,
                "liquidity_score": liq["liquidity_score"],
                "liquidity_numeric": liq["liquidity_numeric"],
                "reasoning": _build_reasoning(card, md, alpha),
            }
        )
    return data


@router.get("", response_model=List[CardResponse])
def list_cards(
    search: Optional[str] = None,
    sport: Optional[str] = None,
    is_rookie: Optional[bool] = None,
    min_alpha_score: Optional[int] = None,
    max_price: Optional[float] = None,
    min_roi: Optional[float] = None,
    population_max: Optional[int] = None,
    serial_numbered: Optional[bool] = None,
    grade: Optional[str] = None,
    sort_by: str = "alpha_score",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Card)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Card.player_name.ilike(term),
                Card.set_name.ilike(term),
                Card.parallel_type.ilike(term),
            )
        )
    if sport:
        query = query.filter(Card.sport == sport)
    if is_rookie is not None:
        query = query.filter(Card.is_rookie == is_rookie)
    if population_max is not None:
        query = query.filter(Card.population <= population_max)
    if serial_numbered:
        query = query.filter(Card.serial_number.isnot(None))
    if grade:
        query = query.filter(Card.grade == grade)

    cards = query.all()
    results = []
    for card in cards:
        md = db.query(MarketData).filter(MarketData.card_id == card.id).first()
        if max_price and md and md.current_price > max_price:
            continue
        enriched = _enrich_card(card, md)
        if min_alpha_score and enriched.get("alpha_score", 0) < min_alpha_score:
            continue
        if min_roi and enriched.get("estimated_roi", 0) < min_roi:
            continue
        results.append(enriched)

    reverse = sort_order == "desc"
    sort_key_map = {
        "alpha_score": lambda x: x.get("alpha_score") or 0,
        "current_price": lambda x: x.get("current_price") or 0,
        "estimated_roi": lambda x: x.get("estimated_roi") or 0,
        "sell_through_rate": lambda x: x.get("sell_through_rate") or 0,
        "player_name": lambda x: x.get("player_name") or "",
    }
    key_fn = sort_key_map.get(sort_by, sort_key_map["alpha_score"])
    results.sort(key=key_fn, reverse=reverse)
    return results[skip : skip + limit]


@router.get("/{card_id}", response_model=CardDetailResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    md = db.query(MarketData).filter(MarketData.card_id == card_id).first()
    alpha = calculate_alpha_score(card, md) if md else None
    proj = calculate_projection(card, md, alpha) if md and alpha else None
    liq = calculate_liquidity(md) if md else None

    card_data = _enrich_card(card, md)

    return {
        "card": card_data,
        "market_data": md,
        "alpha_score": alpha,
        "projection": proj,
        "liquidity": liq,
    }


@router.post("", response_model=CardResponse)
def create_card(
    card_data: CardCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = Card(**card_data.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return _enrich_card(card, None)


@router.put("/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    card_data: CardUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    for field, value in card_data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    md = db.query(MarketData).filter(MarketData.card_id == card_id).first()
    return _enrich_card(card, md)


@router.delete("/{card_id}")
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}


@router.put("/{card_id}/market-data", response_model=MarketDataResponse)
def update_market_data(
    card_id: int,
    md_data: MarketDataCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    md = db.query(MarketData).filter(MarketData.card_id == card_id).first()
    if md:
        for field, value in md_data.model_dump().items():
            setattr(md, field, value)
    else:
        md = MarketData(card_id=card_id, **md_data.model_dump())
        db.add(md)
    db.commit()
    db.refresh(md)
    return md
