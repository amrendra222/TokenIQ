import asyncio
from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .bot_controller import bot
from .config import settings
from .database import Base, engine, get_db
from .routes.market_routes import router as market_router
from .routes.portfolio_routes import router as portfolio_router
from .routes.trade_routes import router as trade_router
from .services.market_service import get_latest_price
from .websocket_manager import ws_manager


Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router)
app.include_router(trade_router)
app.include_router(portfolio_router)


@app.on_event("startup")
async def on_startup() -> None:
    # Place for additional startup logic (warmup, health checks, etc.).
    pass


@app.post("/bot/start", tags=["bot"])
async def start_bot() -> Dict[str, Any]:
    if bot.is_running:
        return {"status": "already_running"}
    try:
        loop = asyncio.get_running_loop()
        bot.start(loop=loop)
        return {"status": "started"}
    except RuntimeError as exc:
        # If no running event loop (e.g. in sync context), surface properly.
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/bot/stop", tags=["bot"])
def stop_bot() -> Dict[str, Any]:
    if not bot.is_running:
        return {"status": "already_stopped"}
    bot.stop()
    return {"status": "stopped"}


@app.get("/bot/status", tags=["bot"])
def bot_status() -> Dict[str, Any]:
    return bot.status


@app.websocket("/ws/price")
async def websocket_price(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            price = get_latest_price()
            payload = {
                "symbol": settings.default_symbol,
                "price": price,
            }
            await ws_manager.send_price(websocket, payload)
            await asyncio.sleep(settings.poll_interval_seconds)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

