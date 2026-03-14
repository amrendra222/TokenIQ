from dotenv import load_dotenv
from pydantic_settings import BaseSettings


load_dotenv()


class Settings(BaseSettings):
    app_name: str = "DeltaAlgo Trader Backend"

    delta_api_key: str | None = None
    delta_api_secret: str | None = None
    delta_base_url: str = "https://testnet-api.delta.exchange"

    default_symbol: str = "BTCUSDT"

    poll_interval_seconds: int = 5
    max_trade_size: float = 0.001  # in base asset units (e.g. BTC)
    stop_loss_pct: float = 0.02
    take_profit_pct: float = 0.04

    database_url: str = "sqlite:///./deltaalgo.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

