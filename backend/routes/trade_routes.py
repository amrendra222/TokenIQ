from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..delta_api import delta_client
from ..models import Trade
from ..services.trade_service import execute_market_order
from ..utils.logger import logger


router = APIRouter(prefix="/trade", tags=["trade"])


@router.post("/execute")
def execute_trade(
    side: str,
    symbol: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    try:
        sym = symbol or settings.default_symbol
        result = execute_market_order(db=db, symbol=sym, side=side)
        return {"status": "success", "trade": result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        logger.exception(f"Error executing trade: {exc}")
        raise HTTPException(status_code=500, detail="Failed to execute trade")


@router.get("/history")
def get_trade_history(db: Session = Depends(get_db)) -> List[dict]:
    trades: List[Trade] = db.query(Trade).order_by(Trade.timestamp.desc()).all()
    history = [
        {
            "trade_id": t.trade_id or str(t.id),
            "symbol": t.symbol,
            "side": t.side,
            "entry_price": t.entry_price,
            "quantity": t.quantity,
            "profit_loss": t.profit_loss,
            "timestamp": t.timestamp.isoformat(),
        }
        for t in trades
    ]
    return history

