from typing import List

from fastapi import WebSocket

from .utils.logger import logger


class WebSocketConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"WebSocket disconnected. Total: {len(self.active_connections)}"
            )

    async def send_price(self, websocket: WebSocket, data: dict) -> None:
        await websocket.send_json(data)

    async def broadcast_price(self, data: dict) -> None:
        logger.info(f"Broadcasting price to {len(self.active_connections)} clients")
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                self.disconnect(connection)


ws_manager = WebSocketConnectionManager()

