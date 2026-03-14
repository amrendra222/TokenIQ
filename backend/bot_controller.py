import asyncio
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from .config import settings
from .database import SessionLocal
from .services.market_service import get_latest_price
from .services.strategy_service import update_and_get_signal
from .services.trade_service import execute_market_order
from .utils.logger import logger


class TradingBot:
    def __init__(self) -> None:
        self._task: Optional[asyncio.Task[Any]] = None
        self._running: bool = False
        self._last_signal: Optional[str] = None
        self._last_price: Optional[float] = None

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def status(self) -> Dict[str, Any]:
        return {
            "running": self._running,
            "last_signal": self._last_signal,
            "last_price": self._last_price,
        }

    async def _run_loop(self) -> None:
        logger.info("Trading bot loop started")
        while self._running:
            try:
                price = get_latest_price()
                self._last_price = price
                signal = update_and_get_signal(price)
                self._last_signal = signal

                if signal in {"BUY", "SELL"}:
                    db: Session = SessionLocal()
                    try:
                        logger.info(f"Bot executing {signal} trade at price {price}")
                        execute_market_order(
                            db=db, symbol=settings.default_symbol, side=signal
                        )
                    finally:
                        db.close()

                await asyncio.sleep(settings.poll_interval_seconds)
            except Exception as exc:  # noqa: BLE001
                logger.exception(f"Error in trading bot loop: {exc}")
                await asyncio.sleep(settings.poll_interval_seconds)

        logger.info("Trading bot loop stopped")

    def start(self, loop: Optional[asyncio.AbstractEventLoop] = None) -> None:
        if self._running:
            logger.info("Trading bot already running")
            return
        self._running = True
        event_loop = loop or asyncio.get_event_loop()
        self._task = event_loop.create_task(self._run_loop())
        logger.info("Trading bot started")

    def stop(self) -> None:
        if not self._running:
            logger.info("Trading bot already stopped")
            return
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("Trading bot stop requested")


bot = TradingBot()

