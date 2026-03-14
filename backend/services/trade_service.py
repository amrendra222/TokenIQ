from datetime import datetime
from typing import Dict

from sqlalchemy.orm import Session

from ..delta_api import delta_client
from ..models import Trade
from ..utils.logger import logger
from .risk_service import risk_manager


def execute_market_order(
    db: Session, symbol: str, side: str
) -> Dict[str, float | str]:
    side = side.upper()
    if side not in {"BUY", "SELL"}:
        raise ValueError("side must be BUY or SELL")

    latest_price = delta_client.get_latest_price(symbol)
    size = risk_manager.compute_order_size(latest_price)
    risk_levels = risk_manager.compute_levels(side, latest_price)

    order_resp = delta_client.place_market_order(
        symbol=symbol, side=side, size=size
    )

    trade_id = (
        str(order_resp.get("result", {}).get("id"))
        if isinstance(order_resp, dict)
        else None
    )

    trade = Trade(
        trade_id=trade_id,
        symbol=symbol,
        side=side,
        entry_price=latest_price,
        quantity=size,
        profit_loss=0.0,
        timestamp=datetime.utcnow(),
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)

    logger.info(
        f"Executed trade {trade.id} {side} {symbol} "
        f"@ {latest_price} qty={size}"
    )

    return {
        "trade_id": trade.trade_id or str(trade.id),
        "symbol": trade.symbol,
        "side": trade.side,
        "entry_price": trade.entry_price,
        "quantity": trade.quantity,
        "stop_loss": risk_levels["stop_loss"],
        "take_profit": risk_levels["take_profit"],
        "timestamp": trade.timestamp.isoformat(),
    }

