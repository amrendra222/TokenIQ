from fastapi import APIRouter, HTTPException

from ..services.market_service import get_latest_price
from ..utils.logger import logger


router = APIRouter(prefix="/market", tags=["market"])


@router.get("/price")
def get_market_price(symbol: str | None = None) -> dict:
    try:
        price = get_latest_price(symbol)
        return {"symbol": symbol or "BTCUSDT", "price": price}
    except Exception as exc:  # noqa: BLE001
        logger.exception(f"Error fetching market price: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch market price")

