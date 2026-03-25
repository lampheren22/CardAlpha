from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from app.database import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    sport = Column(String, index=True, nullable=False)  # "MLB", "NFL", "Pokemon"
    player_name = Column(String, index=True, nullable=False)
    set_name = Column(String, nullable=False)
    card_number = Column(String, nullable=True)
    parallel_type = Column(String, nullable=True)
    is_graded = Column(Boolean, default=False)
    grade_company = Column(String, nullable=True)  # "PSA", "BGS"
    grade = Column(String, nullable=True)  # "10", "9.5", "9"
    population = Column(Integer, nullable=True)
    is_rookie = Column(Boolean, default=False)
    serial_number = Column(Integer, nullable=True)  # e.g. /50 -> 50
    print_run = Column(Integer, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sales = relationship("Sale", back_populates="card", passive_deletes=True)
