# config.py
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env (works both locally and in Docker)
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

class Settings:
    # XRPL
    NETWORK: str = os.getenv("XRPL_NETWORK", "testnet").lower()
    RPC_URL: str = os.getenv(
        "XRPL_RPC_URL",
        "https://s.altnet.rippletest.net:51234" if NETWORK == "testnet"
        else "https://xrplcluster.com"
    )

    # Wallets
    MANUFACTURER_SEED: Optional[str] = os.getenv("MANUFACTURER_SEED")

    # RecycleFi logic
    DEFAULT_DEPOSIT_XRP: float = float(os.getenv("DEFAULT_DEPOSIT_XRP", "10.0"))
    RECYCLER_REWARD_PERCENT: int = int(os.getenv("RECYCLER_REWARD_PERCENT", "70"))
    ESCROW_YEARS: int = int(os.getenv("ESCROW_YEARS", "10"))

    # AMM
    AMM_TOKEN_ISSUER: str = os.getenv("AMM_TOKEN_ISSUER", "")
    AMM_TOKEN_CURRENCY: str = os.getenv("AMM_TOKEN_CURRENCY", "GRN")

    # Frontend
    RECYCLE_DAPP_URL: str = os.getenv(
        "RECYCLE_DAPP_URL",
        "https://padide-vercel.vercel.app"
    )

    @property
    def is_testnet(self) -> bool:
        return "testnet" in self.NETWORK

settings = Settings()