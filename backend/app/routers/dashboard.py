from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.card import Card
from app.models.market_data import MarketData
from app.schemas.card import CardResponse
from app.services.scoring import calculate_alpha_score
from app.services.projection import calculate_projection

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _enrich_cards(cards, db: Session, limit: int = 10) -> List[dict]:
    results = []
    for card in cards:
        md = db.query(MarketData).filter(MarketData.card_id == card.id).first()
        if not md:
            continue
        alpha = calculate_alpha_score(card, md)
        proj = calculate_projection(card, md, alpha)
        pct_vs_90d = 0.0
        if md.price_90d_avg and md.price_90d_avg > 0:
            pct_vs_90d = ((md.current_price - md.price_90d_avg) / md.price_90d_avg) * 100
        results.append(
            {
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
                "current_price": md.current_price,
                "price_90d_avg": md.price_90d_avg,
                "price_vs_90d_pct": round(pct_vs_90d, 1),
                "alpha_score": alpha["total"],
                "recommendation": alpha["recommendation"],
                "estimated_roi": proj["estimated_roi"],
                "risk_rating": proj["risk_rating"],
                "sell_through_rate": md.sell_through_rate,
            }
        )
    results.sort(key=lambda x: x["alpha_score"], reverse=True)
    return results[:limit]


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    cards = db.query(Card).all()
    total = len(cards)
    alpha_scores = []
    roi_list = []
    momentum_count = 0
    rookie_count = 0
    low_pop_count = 0
    buy_signals = 0

    for card in cards:
        md = db.query(MarketData).filter(MarketData.card_id == card.id).first()
        if not md:
            continue
        alpha = calculate_alpha_score(card, md)
        proj = calculate_projection(card, md, alpha)
        alpha_scores.append(alpha["total"])
        roi_list.append(proj["estimated_roi"])
        if alpha["recommendation"] in ("Strong Buy", "Buy"):
            buy_signals += 1
        # Momentum: 7d volume > prior 7d
        prior = max((md.sales_volume_14d or 0) - (md.sales_volume_7d or 0), 0)
        if (md.sales_volume_7d or 0) > prior:
            momentum_count += 1
        if card.is_rookie:
            rookie_count += 1
        if card.population is not None and card.population < 50:
            low_pop_count += 1

    avg_alpha = round(sum(alpha_scores) / len(alpha_scores), 1) if alpha_scores else 0
    avg_roi = round(sum(roi_list) / len(roi_list), 1) if roi_list else 0

    return {
        "total_analyzed": total,
        "buy_signals": buy_signals,
        "avg_alpha_score": avg_alpha,
        "avg_est_roi": avg_roi,
        "momentum_cards": momentum_count,
        "rookie_cards": rookie_count,
        "low_pop_cards": low_pop_count,
    }


@router.get("/top-undervalued", response_model=List[CardResponse])
def get_top_undervalued(
    sport: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Card)
    if sport:
        query = query.filter(Card.sport == sport)
    cards = query.all()
    return _enrich_cards(cards, db, limit=10)


@router.get("/high-momentum", response_model=List[CardResponse])
def get_high_momentum(db: Session = Depends(get_db)):
    cards = db.query(Card).all()
    results = []
    for card in cards:
        md = db.query(MarketData).filter(MarketData.card_id == card.id).first()
        if not md:
            continue
        prior = max((md.sales_volume_14d or 0) - (md.sales_volume_7d or 0), 0)
        if prior > 0:
            ratio = (md.sales_volume_7d or 0) / prior
        else:
            ratio = 0
        alpha = calculate_alpha_score(card, md)
        proj = calculate_projection(card, md, alpha)
        pct_vs_90d = 0.0
        if md.price_90d_avg and md.price_90d_avg > 0:
            pct_vs_90d = ((md.current_price - md.price_90d_avg) / md.price_90d_avg) * 100
        results.append(
            {
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
                "current_price": md.current_price,
                "price_90d_avg": md.price_90d_avg,
                "price_vs_90d_pct": round(pct_vs_90d, 1),
                "alpha_score": alpha["total"],
                "recommendation": alpha["recommendation"],
                "estimated_roi": proj["estimated_roi"],
                "risk_rating": proj["risk_rating"],
                "sell_through_rate": md.sell_through_rate,
                "_momentum_ratio": ratio,
            }
        )
    results.sort(key=lambda x: x["_momentum_ratio"], reverse=True)
    for r in results:
        r.pop("_momentum_ratio", None)
    return results[:10]


@router.get("/rookie-opportunities", response_model=List[CardResponse])
def get_rookie_opportunities(db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.is_rookie == True).all()
    return _enrich_cards(cards, db, limit=10)


@router.get("/low-pop-breakouts", response_model=List[CardResponse])
def get_low_pop_breakouts(db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.population < 50).all()
    return _enrich_cards(cards, db, limit=10)


@router.get("/pokemon-movers", response_model=List[CardResponse])
def get_pokemon_movers(db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.sport == "Pokemon").all()
    return _enrich_cards(cards, db, limit=10)
