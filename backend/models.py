from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from .database import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trade_id = Column(String, index=True, nullable=True)
    symbol = Column(String, index=True, nullable=False)
    side = Column(String, nullable=False)  # BUY / SELL
    entry_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    profit_loss = Column(Float, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

