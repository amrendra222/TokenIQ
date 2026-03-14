from fastapi import APIRouter, HTTPException

from ..delta_api import delta_client
from ..utils.logger import logger


router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("")
def get_portfolio() -> dict:
    try:
        portfolio = delta_client.get_portfolio()
        return portfolio
    except Exception as exc:  # noqa: BLE001
        logger.exception(f"Error fetching portfolio: {exc}")
        raise HTTPException(status_code=500, detail="Failed to fetch portfolio")

