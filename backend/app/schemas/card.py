from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any


class MarketDataResponse(BaseModel):
    current_price: float
    price_7d_avg: Optional[float]
    price_30d_avg: Optional[float]
    price_90d_avg: Optional[float]
    price_ath: Optional[float]
    price_atl: Optional[float]
    sales_volume_7d: int
    sales_volume_14d: int
    sales_volume_30d: int
    sell_through_rate: float
    avg_days_to_sell: Optional[float]
    sales_per_week: Optional[float]
    price_history: List[Any]
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True


class CardBase(BaseModel):
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


class CardCreate(CardBase):
    pass


class CardUpdate(CardBase):
    pass


class MarketDataCreate(BaseModel):
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
    price_history: List[Any] = []


class AlphaFactorScore(BaseModel):
    score: float
    max: int
    value: Optional[float] = None


class AlphaScoreBreakdown(BaseModel):
    total: int
    recommendation: str
    breakdown: dict


class ProjectionResponse(BaseModel):
    fair_value_low: float
    fair_value_high: float
    conservative_exit: float
    aggressive_exit: float
    estimated_roi: float
    risk_rating: str


class CardResponse(CardBase):
    id: int
    created_at: datetime
    # Flattened market fields for list views
    current_price: Optional[float] = None
    price_90d_avg: Optional[float] = None
    price_vs_90d_pct: Optional[float] = None
    alpha_score: Optional[int] = None
    recommendation: Optional[str] = None
    estimated_roi: Optional[float] = None
    risk_rating: Optional[str] = None
    sell_through_rate: Optional[float] = None

    class Config:
        from_attributes = True


class CardDetailResponse(BaseModel):
    card: CardResponse
    market_data: Optional[MarketDataResponse]
    alpha_score: Optional[AlphaScoreBreakdown]
    projection: Optional[ProjectionResponse]
