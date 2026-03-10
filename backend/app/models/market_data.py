from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from app.database import Base


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), unique=True, index=True)
    current_price = Column(Float, nullable=False)
    price_7d_avg = Column(Float, nullable=True)
    price_30d_avg = Column(Float, nullable=True)
    price_90d_avg = Column(Float, nullable=True)
    price_ath = Column(Float, nullable=True)  # All-time high
    price_atl = Column(Float, nullable=True)  # All-time low
    sales_volume_7d = Column(Integer, default=0)
    sales_volume_14d = Column(Integer, default=0)
    sales_volume_30d = Column(Integer, default=0)
    sell_through_rate = Column(Float, default=0.0)  # 0–100 %
    avg_days_to_sell = Column(Float, nullable=True)
    sales_per_week = Column(Float, nullable=True)
    price_history = Column(JSON, default=list)  # [{date, price, volume}]
    last_updated = Column(DateTime, default=datetime.utcnow)
