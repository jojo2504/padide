# models.py
"""
CYCLR Database Models - Complete Product Lifecycle

BUSINESS MODEL:
===============
STEP 1 - REGISTRATION: Manufacturer deposits 5% → AMM
STEP 2 - SALE: Customer pays price + 5% escrow → AMM, 1% fee → CYCLR, 99% → Manufacturer

OUTCOMES:
---------
CASE A: Sold & Recycled
  - Deposits returned: Customer 50€, Manufacturer 50€
  - APY split: Customer 40%, Manufacturer 20%, Recycler 20%, Eco Fund 20%

CASE B: Sold & NOT Recycled (expired)
  - Deposits returned: Customer 50€, Manufacturer 50€
  - APY: 100% → CYCLR

CASE C: NOT Sold & Recycled (manufacturer recalls)
  - Deposit returned: Manufacturer 50€
  - APY split: Manufacturer 50%, CYCLR 50%

CASE D: NOT Sold & Expired
  - Deposit returned: Manufacturer 50€
  - APY: 100% → CYCLR
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
from uuid import uuid4


# Expiry period
EXPIRY_YEARS = 6


class ProductStatus(str, Enum):
    """Product lifecycle status"""
    REGISTERED = "registered"       # Manufacturer registered, waiting for sale
    SOLD = "sold"                   # Product sold to customer
    RECYCLED = "recycled"           # Product recycled, rewards distributed
    EXPIRED = "expired"             # Expired without recycling
    RECALLED = "recalled"           # Manufacturer recalled unsold product


class Product(BaseModel):
    """Core product model - tracks full lifecycle"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    
    # Product info
    name: str
    description: str = ""
    serial_number: str = ""
    price: float                            # Selling price (e.g., 1000 CUSD)
    
    # Deposit amounts (5% each)
    manufacturer_deposit: float = 0.0       # 5% paid at registration
    customer_escrow: float = 0.0            # 5% paid at sale
    total_in_amm: float = 0.0               # Total deposited
    
    # Fee
    cyclr_fee: float = 0.0                  # 1% of sale price
    manufacturer_payout: float = 0.0        # 99% of sale price to manufacturer
    
    # LP tokens (for AMM tracking)
    manufacturer_lp_tokens: float = 0.0
    customer_lp_tokens: float = 0.0
    total_lp_tokens: float = 0.0
    
    # Transaction hashes
    registration_tx: Optional[str] = None   # Manufacturer deposit TX
    sale_deposit_tx: Optional[str] = None   # Customer escrow TX
    sale_payout_tx: Optional[str] = None    # Payment to manufacturer TX
    recycle_tx: Optional[str] = None        # Withdrawal TX
    
    # Wallets
    manufacturer_wallet: str
    customer_wallet: Optional[str] = None
    recycler_wallet: Optional[str] = None
    
    # NFT
    nft_id: Optional[str] = None
    nft_token_id: Optional[int] = None
    mint_tx: Optional[str] = None
    
    # Dates
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sold_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None   # 6 years from sale
    recycled_at: Optional[datetime] = None
    
    # Status
    status: ProductStatus = ProductStatus.REGISTERED
    
    # Rewards (filled on recycle/expire)
    total_withdrawn: float = 0.0            # Total from AMM
    apy_earned: float = 0.0                 # Yield portion
    
    # Distribution tracking
    customer_received: float = 0.0
    manufacturer_received: float = 0.0
    recycler_received: float = 0.0
    eco_fund_received: float = 0.0
    cyclr_received: float = 0.0
    
    distribution_txs: Dict[str, str] = Field(default_factory=dict)


# ========================================
# API REQUEST MODELS
# ========================================

class RegisterProductRequest(BaseModel):
    """STEP 1: Manufacturer registers product"""
    name: str
    description: str = ""
    serial_number: str = ""
    price: float                            # Selling price in CUSD
    manufacturer_wallet: str


class SellProductRequest(BaseModel):
    """STEP 2: Record product sale to customer"""
    product_id: str
    customer_wallet: str


class RecycleProductRequest(BaseModel):
    """STEP 3: Recycle product"""
    product_id: str
    recycler_wallet: str
    eco_fund_wallet: Optional[str] = None


class RecallProductRequest(BaseModel):
    """Manufacturer recalls unsold product"""
    product_id: str
    recycle: bool = False                   # True = recycle, False = just recall


# ========================================
# API RESPONSE MODELS
# ========================================

class ProductResponse(BaseModel):
    """API response for a product"""
    id: str
    name: str
    description: str
    serial_number: str
    price: float
    status: str
    
    # Deposits
    manufacturer_deposit: float
    customer_escrow: float
    total_in_amm: float
    cyclr_fee: float
    
    # Wallets
    manufacturer_wallet: str
    customer_wallet: Optional[str]
    recycler_wallet: Optional[str]
    
    # NFT
    nft_id: Optional[str]
    
    # Dates
    created_at: datetime
    sold_at: Optional[datetime]
    expires_at: Optional[datetime]
    recycled_at: Optional[datetime]
    days_until_expiry: Optional[int] = None
    
    # Rewards
    total_withdrawn: float
    apy_earned: float
    customer_received: float
    manufacturer_received: float
    recycler_received: float
    eco_fund_received: float
    cyclr_received: float
    
    # Estimated current value (if still in AMM)
    estimated_current_value: float = 0.0
    estimated_apy: float = 0.0


class RecycleResponse(BaseModel):
    """Response after recycling"""
    success: bool
    product_id: str
    case: str                               # "A", "B", "C", or "D"
    total_withdrawn: float
    apy_earned: float
    distribution: Dict[str, float]
    tx_hashes: Dict[str, str]
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check"""
    status: str
    cyclr_wallet: str
    cusd_issuer: str
    amm_available: bool


class AMMInfoResponse(BaseModel):
    """AMM pool info"""
    success: bool
    amm_account: Optional[str] = None
    xrp_pool: float = 0.0
    cusd_pool: float = 0.0
    trading_fee_percent: float = 0.0
    total_products_in_pool: int = 0
    total_value_locked: float = 0.0
    error: Optional[str] = None


# ========================================
# DATABASE (In-memory, replace with real DB)
# ========================================

products_db: Dict[str, Product] = {}


def save_product(product: Product) -> Product:
    products_db[product.id] = product
    return product


def get_product(product_id: str) -> Optional[Product]:
    return products_db.get(product_id)


def get_all_products() -> List[Product]:
    return list(products_db.values())


def get_products_by_status(status: ProductStatus) -> List[Product]:
    return [p for p in products_db.values() if p.status == status]


def get_expired_products() -> List[Product]:
    """Get sold products past expiry date"""
    now = datetime.now(timezone.utc)
    return [
        p for p in products_db.values()
        if p.status == ProductStatus.SOLD
        and p.expires_at
        and p.expires_at < now
    ]


def update_product(product: Product) -> Product:
    products_db[product.id] = product
    return product
