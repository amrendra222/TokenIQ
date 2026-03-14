from ..config import settings
from ..strategy_engine import MovingAverageCrossoverStrategy, Signal
from ..utils.logger import logger


strategy = MovingAverageCrossoverStrategy()


def update_and_get_signal(price: float) -> Signal:
    strategy.add_price(price)
    signal = strategy.generate_signal()
    logger.info(f"Generated strategy signal {signal} at price {price}")
    return signal

