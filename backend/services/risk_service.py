from dataclasses import dataclass

from ..config import settings
from ..utils.logger import logger


@dataclass
class RiskParams:
    max_trade_size: float
    stop_loss_pct: float
    take_profit_pct: float


class RiskManager:
    """
    Centralised risk manager used by the trading bot and manual orders.

    Currently:
    - Caps per-trade size by `max_trade_size` (in base asset units).
    - Applies fixed % stop-loss / take-profit around entry price.
    """

    def __init__(self, params: RiskParams) -> None:
        self.params = params

    def compute_order_size(self, latest_price: float) -> float:
        # Hook for more advanced logic (e.g. % of balance, volatility, etc.)
        size = self.params.max_trade_size
        logger.info(f"[RiskManager] order_size={size} at price={latest_price}")
        return size

    def compute_levels(self, side: str, entry_price: float) -> dict[str, float]:
        side = side.upper()
        if side == "BUY":
            stop_loss = entry_price * (1 - self.params.stop_loss_pct)
            take_profit = entry_price * (1 + self.params.take_profit_pct)
        else:
            stop_loss = entry_price * (1 + self.params.stop_loss_pct)
            take_profit = entry_price * (1 - self.params.take_profit_pct)

        logger.info(
            "[RiskManager] levels "
            f"side={side} entry={entry_price} sl={stop_loss} tp={take_profit}"
        )
        return {"stop_loss": stop_loss, "take_profit": take_profit}


risk_manager = RiskManager(
    RiskParams(
        max_trade_size=settings.max_trade_size,
        stop_loss_pct=settings.stop_loss_pct,
        take_profit_pct=settings.take_profit_pct,
    )
)

