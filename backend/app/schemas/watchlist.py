from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.card import CardResponse


class WatchlistItemCreate(BaseModel):
    card_id: int


class WatchlistItemResponse(BaseModel):
    id: int
    card_id: int
    card: Optional[CardResponse] = None
    added_at: datetime

    class Config:
        from_attributes = True


class PortfolioItemCreate(BaseModel):
    card_id: int
    purchase_price: float
    purchase_date: Optional[datetime] = None
    quantity: int = 1
    notes: Optional[str] = None


class PortfolioItemResponse(BaseModel):
    id: int
    card_id: int
    card: Optional[CardResponse] = None
    purchase_price: float
    purchase_date: Optional[datetime]
    quantity: int
    notes: Optional[str]
    current_value: Optional[float] = None
    unrealized_gain: Optional[float] = None
    unrealized_gain_pct: Optional[float] = None
    added_at: datetime

    class Config:
        from_attributes = True


class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    total_gain: float
    total_gain_pct: float
    num_positions: int
