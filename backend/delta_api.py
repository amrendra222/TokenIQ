import ccxt
import os
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

class DeltaClient:
    def __init__(self):
        self.api_key = os.getenv("DELTA_API_KEY", "")
        self.api_secret = os.getenv("DELTA_API_SECRET", "")
        
        # Configure CCXT for Delta Exchange
        self.exchange = ccxt.delta({
            'apiKey': self.api_key,
            'secret': self.api_secret,
            'enableRateLimit': True,
        })
        
        # Point to testnet if applicable by ccxt, otherwise sandbox
        self.exchange.set_sandbox_mode(True)

    def fetch_market_data(self, symbol: str = 'BTC/USDT', timeframe: str = '1h', limit: int = 100) -> pd.DataFrame:
        """Fetches historical market data and returns a pandas DataFrame."""
        try:
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            print(f"Error fetching market data: {e}")
            return pd.DataFrame()

    def place_market_order(self, symbol: str, side: str, amount: float):
        """Places a market buy/sell order."""
        try:
            order = self.exchange.create_market_order(symbol, side.lower(), amount)
            return order
        except Exception as e:
            print(f"Error placing order: {e}")
            return None

    def get_account_balance(self):
        """Fetches account balance data."""
        try:
            balance = self.exchange.fetch_balance()
            return balance
        except Exception as e:
            print(f"Error fetching balance: {e}")
            return {}

    def fetch_open_positions(self, symbols=None):
        try:
            positions = self.exchange.fetch_positions(symbols)
            return positions
        except Exception as e:
            print(f"Error fetching positions: {e}")
            return []

if __name__ == "__main__":
    client = DeltaClient()
    print("Market Data:", client.fetch_market_data(limit=5))
