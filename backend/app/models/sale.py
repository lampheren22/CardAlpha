from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="SET NULL"), nullable=True, index=True)
    raw_title = Column(String, nullable=False)
    normalized_key = Column(String, index=True)
    sale_price = Column(Float, nullable=False)
    sale_date = Column(DateTime, nullable=False, index=True)
    condition = Column(String, nullable=True)
    source = Column(String, default="ebay")
    ebay_item_id = Column(String, unique=True, index=True)
    is_outlier = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("Card", back_populates="sales", passive_deletes=True)
