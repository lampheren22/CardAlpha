from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from app.database import Base


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), index=True)
    added_at = Column(DateTime, default=datetime.utcnow)


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), index=True)
    purchase_price = Column(Float, nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    quantity = Column(Integer, default=1)
    notes = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
