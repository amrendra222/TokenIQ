from collections import deque
from typing import Deque, List, Literal, Optional

from .utils.logger import logger


Signal = Literal["BUY", "SELL", "HOLD"]


class MovingAverageCrossoverStrategy:
    """
    Simple moving average crossover strategy.

    - Short MA: 5 periods
    - Long MA: 20 periods
    """

    def __init__(self, short_window: int = 5, long_window: int = 20) -> None:
        if short_window >= long_window:
            raise ValueError("short_window must be < long_window")
        self.short_window = short_window
        self.long_window = long_window

        self._prices: Deque[float] = deque(maxlen=long_window)

    def add_price(self, price: float) -> None:
        self._prices.append(price)
        logger.info(f"Added price for strategy: {price}")

    def _moving_average(self, window: int) -> Optional[float]:
        if len(self._prices) < window:
            return None
        prices: List[float] = list(self._prices)[-window:]
        return sum(prices) / len(prices)

    def generate_signal(self) -> Signal:
        short_ma = self._moving_average(self.short_window)
        long_ma = self._moving_average(self.long_window)

        if short_ma is None or long_ma is None:
            logger.info("Not enough data for MA crossover, HOLD")
            return "HOLD"

        logger.info(
            f"Strategy MAs - short: {short_ma:.4f}, long: {long_ma:.4f}"
        )

        if short_ma > long_ma:
            logger.info("Strategy signal: BUY")
            return "BUY"
        if short_ma < long_ma:
            logger.info("Strategy signal: SELL")
            return "SELL"
        logger.info("Strategy signal: HOLD")
        return "HOLD"

