from typing import Any, Dict, Optional

import requests

from .config import settings
from .utils.logger import logger


class DeltaExchangeClient:
    """
    Minimal Delta Exchange Testnet REST client.

    NOTE: Delta's authentication scheme may require HMAC signing.
    This client is structured so auth logic can be easily extended.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> None:
        self.api_key = api_key or settings.delta_api_key
        self.api_secret = api_secret or settings.delta_api_secret
        self.base_url = (base_url or settings.delta_base_url).rstrip("/")

    def _headers(self) -> Dict[str, str]:
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            # Placeholder header names – adjust to actual Delta API spec if needed.
            headers["api-key"] = self.api_key
        if self.api_secret:
            headers["api-secret"] = self.api_secret
        return headers

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        logger.info(f"Fetching market data from {url} with params={params}")
        resp = requests.get(url, headers=self._headers(), params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, data: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        logger.info(f"Posting order to {url} with data={data}")
        resp = requests.post(url, headers=self._headers(), json=data, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def get_latest_price(self, symbol: str) -> float:
        """
        Fetch latest price for a symbol.

        This assumes a ticker-style endpoint; adapt the path/fields to Delta's spec.
        """
        data = self._get("/v2/tickers", params={"symbol": symbol})

        # Example shape handling; adjust to actual API format
        price: Optional[float] = None
        if isinstance(data, dict):
            if "result" in data and isinstance(data["result"], list) and data["result"]:
                price = float(data["result"][0].get("mark_price") or data["result"][0].get("last_price"))
            elif "last_price" in data:
                price = float(data["last_price"])

        if price is None:
            raise ValueError("Unable to parse price from Delta response")

        logger.info(f"Latest price for {symbol}: {price}")
        return price

    def place_market_order(
        self, symbol: str, side: str, size: float
    ) -> Dict[str, Any]:
        """
        Place a market order.

        Adapt payload to fit Delta's order placement schema.
        """
        payload = {
            "symbol": symbol,
            "side": side.upper(),
            "order_type": "market",
            "size": size,
        }
        response = self._post("/v2/orders", data=payload)
        logger.info(f"Order response: {response}")
        return response

    def get_portfolio(self) -> Dict[str, Any]:
        """
        Fetch account balances and open positions.
        """
        balances = self._get("/v2/balances")
        positions = self._get("/v2/positions")
        portfolio = {"balances": balances, "positions": positions}
        logger.info("Fetched portfolio data")
        return portfolio


delta_client = DeltaExchangeClient()

