# config.py
"""
CYCLR Configuration - Circular Economy Platform

Business Model:
- Manufacturer deposit: 5% → AMM
- Customer escrow: 5% → AMM
- CYCLR fee on sale: 1%
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)


class Settings(BaseSettings):
    # XRPL Network
    RECYCLEFI_SEED: str = ""
    DEPOSIT_PERCENT: float = 6.0        # % of purchase locked in AMM
    RECYCLER_REWARD_PCT: int = 70       # % of AMM withdrawal → recycler
    COMPANY_BONUS_PCT: int = 20         # % → partner (Apple, etc.)
    PROTOCOL_FEE_PCT: int = 10 

    NETWORK: str = os.getenv("XRPL_NETWORK", "testnet")
    RPC_URL: str = os.getenv("XRPL_RPC_URL", "https://s.altnet.rippletest.net:51234")
    
    # CUSD Token (CYCLR USD - Issued Currency)
    CUSD_ISSUER: str = os.getenv("CUSD_ISSUER", "rpWYyReCdfisZEd99q14gg96NrAEpcauMt")
    CUSD_ISSUER_SECRET: str = os.getenv("CUSD_ISSUER_SECRET", "")
    CUSD_CURRENCY: str = "CUSD"
    # Hex format for 4-char currency codes
    CUSD_HEX: str = "4355534400000000000000000000000000000000"
    
    # For backward compatibility (alias)
    RUSD_ISSUER: str = CUSD_ISSUER
    RUSD_ISSUER_SECRET: str = CUSD_ISSUER_SECRET
    RUSD_CURRENCY: str = CUSD_CURRENCY
    
    # Pool Creator (created the AMM, holds LP tokens)
    POOL_CREATOR: str = os.getenv("POOL_CREATOR", "rLLVTDLWfomZ9gm8BbmuYryG3nTHtwPZvu")
    POOL_CREATOR_SECRET: str = os.getenv("POOL_CREATOR_SECRET", "")
    
    # CYCLR Platform Wallet (main operational wallet)
    CYCLR_WALLET: str = os.getenv("CYCLR_WALLET", "rBbKwL2QEDMPvC8e2zAogfBwLB3pwkcLLJ")
    CYCLR_WALLET_SECRET: str = os.getenv("CYCLR_WALLET_SECRET", "")
    
    # Ecological Fund Wallet
    ECO_FUND_WALLET: str = os.getenv("ECO_FUND_WALLET", "")
    
    # ===================================
    # Fee Structure
    # ===================================
    
    # Step 1: Registration
    MANUFACTURER_DEPOSIT_PERCENT: float = 5.0   # 5% of price → AMM
    
    # Step 2: Sale
    CUSTOMER_ESCROW_PERCENT: float = 5.0        # 5% of price → AMM
    CYCLR_FEE_PERCENT: float = 1.0              # 1% fee for CYCLR platform
    MANUFACTURER_PAYMENT_PERCENT: float = 99.0  # 99% of price → Manufacturer
    
    # Legacy alias
    DEPOSIT_PERCENT: float = 5.0
    
    # ===================================
    # APY Distribution (Case A: Sold & Recycled)
    # ===================================
    USER_REWARD_PERCENT: float = 40.0           # Buyer gets 40% of APY
    MANUFACTURER_REWARD_PERCENT: float = 20.0   # Manufacturer gets 20% of APY
    RECYCLER_REWARD_PERCENT: float = 20.0       # Recycler gets 20% of APY
    ECO_FUND_REWARD_PERCENT: float = 20.0       # Ecological fund gets 20% of APY
    
    # ===================================
    # AMM Pool Info
    # ===================================
    AMM_ACCOUNT: str = os.getenv("AMM_ACCOUNT", "rN66ywBQKiGV2X2kYsuQsB2uJyG5cJLiKT")
    AMM_TRADING_FEE_PERCENT: float = 0.1        # 0.1% trading fee
    
    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    RECYCLE_DAPP_URL: str = "http://localhost:3000"

settings = Settings()
