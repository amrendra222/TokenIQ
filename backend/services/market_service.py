from . import trade_service  # noqa: F401  # to ensure package import in some tools
from ..config import settings
from ..delta_api import delta_client
from ..utils.logger import logger


def get_latest_price(symbol: str | None = None) -> float:
    sym = symbol or settings.default_symbol
    price = delta_client.get_latest_price(sym)
    logger.info(f"Market price fetched for {sym}: {price}")
    return price

