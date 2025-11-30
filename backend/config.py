# config.py — Clean & Updated for RecycleFi v3 (2025)
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # ───────────────────────────────
    # XRPL Network
    # ───────────────────────────────
    NETWORK: str = "testnet"  # auto-detected from RPC_URL if needed
    RPC_URL: str = "https://s.altnet.rippletest.net:51234/"

    # ───────────────────────────────
    # Protocol Wallet (Factory / You)
    # ───────────────────────────────
    RECYCLEFI_SEED: str = ""  # this is us

    # ───────────────────────────────
    # Business Logic
    # ───────────────────────────────
    DEPOSIT_PERCENT: float = 6.0        # % of purchase locked in AMM
    RECYCLER_REWARD_PCT: int = 70       # % of AMM withdrawal → recycler
    COMPANY_BONUS_PCT: int = 20         # % → partner (Apple, etc.)
    PROTOCOL_FEE_PCT: int = 10          # % → you (second bite!)

    # ───────────────────────────────
    # AMM Pool (XRP + Stablecoin)
    # ───────────────────────────────
    STABLECOIN_CURRENCY: str = "5255534400000000000000000000000000000000"  # RUSD hex
    STABLECOIN_ISSUER: str = "rEfT7xJtREcwJtKydXQXoMALPaeDLkuQP1"

    # ───────────────────────────────
    # Frontend
    # ───────────────────────────────
    RECYCLE_DAPP_URL: str = "http://localhost:3000"

    # Optional: default company wallet (can be overridden per purchase)
    DEFAULT_COMPANY_WALLET: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create singleton
settings = Settings()