# main.py
"""
CYCLR Backend API - Circular Economy Product Lifecycle

Business Model:
==============
STEP 1 - REGISTRATION: Manufacturer pays 5% deposit → AMM
STEP 2 - SALE: Customer pays price + 5% escrow
         - 1% fee → CYCLR platform
         - 99% of price → Manufacturer

CASE A: Sold & Recycled → Both deposits returned + APY split (40/20/20/20)
CASE B: Sold & NOT Recycled (expired) → Deposits returned, CYCLR keeps 100% APY
CASE C: NOT Sold & Recycled → Manufacturer gets deposit + 50% APY, CYCLR 50%
CASE D: NOT Sold & Expired → Manufacturer gets deposit, CYCLR keeps 100% APY
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from xrpl.models import (
    Payment, Memo, AMMDeposit, AMMWithdraw, IssuedCurrencyAmount,
    AMMDepositFlag, AMMWithdrawFlag, NFTokenBurn
)
from xrpl.models.currencies import XRP, IssuedCurrency
from config import settings
from models import (
    Product, ProductStatus,
    RegisterProductRequest, SellProductRequest, RecycleProductRequest, RecallProductRequest,
    ProductResponse, RecycleResponse, HealthResponse, AMMInfoResponse,
    save_product, get_product, get_all_products, update_product, get_products_by_status
)
from xrpl.utils import xrp_to_drops
from xrpl.wallet import Wallet
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill, sign, submit_and_wait

from xrpl_service import xrpl_service
from xrpl_helpers import client, RECYCLEFI, create_recyclable_item_v3
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import os
from typing import Optional

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill, sign, submit_and_wait
from xrpl.models import (
    Payment, Memo, AMMDeposit, AMMWithdraw, IssuedCurrencyAmount,
    AMMDepositFlag, AMMWithdrawFlag, NFTokenBurn
)
from xrpl.models.requests import AccountTx, AMMInfo, Tx, AccountLines
from xrpl.models.currencies import XRP, IssuedCurrency
from xrpl.models import NFTokenBurn as NFTokenBurnTransaction, AccountInfo
from xrpl.utils import xrp_to_drops
from xrpl.wallet import Wallet

from xrpl_helpers import client, RECYCLEFI, create_recyclable_item_v3
from config import settings

# Fee constants (should be moved to config.py)
MANUFACTURER_DEPOSIT_PERCENT = 5.0
CUSTOMER_ESCROW_PERCENT = 5.0
CYCLR_FEE_PERCENT = 1.0

# APY distribution splits
APY_USER_SHARE = 0.40        # 40% to buyer
APY_MANUFACTURER_SHARE = 0.20  # 20% to manufacturer
APY_RECYCLER_SHARE = 0.20    # 20% to recycler
APY_ECO_FUND_SHARE = 0.20    # 20% to ecological fund


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle - startup and shutdown"""
    print("=" * 60)
    print("CYCLR Backend Starting - Circular Economy Platform")
    print(f"XRPL Network: {settings.RPC_URL}")
    print(f"CYCLR Wallet: {settings.CYCLR_WALLET}")
    print(f"CUSD Issuer: {settings.CUSD_ISSUER}")
    print(f"Fee Structure:")
    print(f"  - Manufacturer deposit: {MANUFACTURER_DEPOSIT_PERCENT}%")
    print(f"  - Customer escrow: {CUSTOMER_ESCROW_PERCENT}%")
    print(f"  - CYCLR fee on sale: {CYCLR_FEE_PERCENT}%")
    print("=" * 60)
    yield
    print("CYCLR Backend Shutting Down")
    

CUSD_HEX = "4355534400000000000000000000000000000000"  # CUSD
CUSD_ISSUER = "rpWYyReCdfisZEd99q14gg96NrAEpcauMt"
CUSD_CURRENCY = IssuedCurrencyAmount(currency=CUSD_HEX, issuer=CUSD_ISSUER, value="0")
XRP_ASSET = XRP()
CUSD_ASSET = IssuedCurrency(currency=CUSD_HEX, issuer=CUSD_ISSUER)

app = FastAPI(
    title="CYCLR API",
    description="Circular Economy Platform - Product Lifecycle with XRPL AMM Rewards",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BurnClaimRequest(BaseModel):
    nft_id: str           # Full NFTokenID (e.g. 000813...)
    user_wallet: str      # r...
    burn_tx_hash: str     # Hash of NFTokenBurn transaction

# ========================================
# HELPER FUNCTIONS
# ========================================

@app.post("/api/v1/redeem-expired")
async def redeem_expired_nft(
    nft_id: str = Form(...),
    company_wallet: str = Form(...)
):
    nft_id = nft_id.strip().upper()
    company_wallet = company_wallet.strip()

    print(f"\n[REDEEM-EXPIRED] Triggered for NFT: ...{nft_id[-12:]}")
    print(f"               Company wallet: {company_wallet}")

    # Find deposit via memo
    deposit = await find_deposit_by_nft_id(nft_id)
    if not deposit:
        raise HTTPException(404, "No AMM deposit found for this NFT")

    # Get AMM info
    amm_info = await client.request(AMMInfo(asset=XRP_ASSET, asset2=CUSD_ASSET))
    amm = amm_info.result["amm"]
    lp_token = amm["lp_token"]
    print(f"[REDEEM] LP Token: {lp_token['currency']} from {lp_token['issuer'][:8]}...")

    # Get LP balance
    lines = await client.request(AccountLines(account=RECYCLEFI.classic_address))
    lp_balance = 0.0
    for line in lines.result.get("lines", []):
        if line.get("currency") == lp_token["currency"] and line.get("account") == lp_token["issuer"]:
            lp_balance = float(line["balance"])
            break

    if lp_balance <= 0:
        raise HTTPException(400, "No LP tokens")
    print(f"[REDEEM] Withdrawing {lp_balance:.6f} LP tokens...")

    # === CORRECT FIELD NAME FOR xrpl-py 4.3.1 ===
    try:
        withdraw_tx = AMMWithdraw(
            account=RECYCLEFI.classic_address,
            asset=XRP_ASSET,
            asset2=CUSD_ASSET,
            lp_token_in=IssuedCurrencyAmount(  # ← THIS IS THE ONE THAT WORKS
                currency=lp_token["currency"],
                issuer=lp_token["issuer"],
                value=str(lp_balance)
            ),
            flags=AMMWithdrawFlag.TF_WITHDRAW_ALL
        )

        before = await client.request(AccountInfo(account=RECYCLEFI.classic_address))
        before_xrp = int(before.result["account_data"]["Balance"]) / 1_000_000

        signed = sign(await autofill(withdraw_tx, client), RECYCLEFI)
        result = await submit_and_wait(signed, client)

        if result.result["meta"]["TransactionResult"] != "tesSUCCESS":
            raise Exception(result.result["meta"]["TransactionResult"])

        await asyncio.sleep(5)
        after = await client.request(AccountInfo(account=RECYCLEFI.classic_address))
        after_xrp = int(after.result["account_data"]["Balance"]) / 1_000_000
        received_xrp = after_xrp - before_xrp

        print(f"[REDEEM] SUCCESS! Received {received_xrp:.4f} XRP")
    except Exception as e:
        print(f"[REDEEM] WITHDRAW FAILED: {e}")
        raise HTTPException(500, f"Withdraw failed: {e}")

    # Distribute 80/20
    company_share = received_xrp * 0.8
    protocol_share = received_xrp * 0.2

    async def pay(to, amt, label):
        if amt < 0.0001: return None
        tx = Payment(account=RECYCLEFI.classic_address, destination=to, amount=xrp_to_drops(amt))
        signed = sign(await autofill(tx, client), RECYCLEFI)
        resp = await submit_and_wait(signed, client)
        h = resp.result["hash"]
        print(f"   → {label}: {amt:.4f} XRP → {h[:10]}...")
        return h

    await pay(company_wallet, company_share, "Company 80%")
    await pay(RECYCLEFI.classic_address, protocol_share, "RecycleFi 20%")

    return {"success": True, "withdrawn_xrp": round(received_xrp, 4), "company_80%": round(company_share, 4)}

async def find_deposit_by_nft_id(nft_id: str) -> dict | None:
    """Find AMMDeposit that contains this NFT ID in its memo"""
    try:
        resp = await client.request(AccountTx(
            account=RECYCLEFI.classic_address,
            limit=1000
        ))
    except:
        return None

    target_hex = nft_id.upper().encode("utf-8").hex().upper()

    for entry in resp.result["transactions"]:
        tx = entry.get("tx") or entry.get("tx_json", {})
        meta = entry.get("meta", {})

        if tx.get("TransactionType") != "AMMDeposit":
            continue
        if meta.get("TransactionResult") != "tesSUCCESS":
            continue

        for memo in tx.get("Memos", []):
            data = memo["Memo"].get("MemoData", "").upper()
            if data == target_hex:
                return {
                    "tx": tx,
                    "meta": meta,
                    "amm_account": meta.get("amm_account")
                }
    return None


async def get_lp_balance() -> float:
    try:
        info = await client.request(AMMInfo(asset=XRP_ASSET, asset2=CUSD_ASSET))
        lp_token = info.result["amm"]["lp_token"]
        for bal in lp_token.get("balance", []):
            if bal["account"] == RECYCLEFI.classic_address:
                return float(bal["value"])
        return 0.0
    except Exception as e:
        print(f"AMMInfo failed: {e}")
        return 0.0

@app.post("/api/v1/purchase")
async def process_circular_purchase(
    product_name: str = Form("Eco Bottle"),
    price_xrp: float = Form(...),
    deposit_percent: float = Form(6.0),
    company_wallet: str = Form(...),
    consumer_wallet: str = Form(...),
    metadata: Optional[str] = Form(None)
):
    item = await create_recyclable_item_v3(
        product_name=product_name,
        price_xrp=price_xrp,
        deposit_percent=deposit_percent,
        company_wallet=company_wallet,
        consumer_wallet=consumer_wallet
    )

    # Pay company 93% instantly
    company_share = price_xrp * 0.93
    pay_tx = Payment(
        account=RECYCLEFI.classic_address,
        destination=company_wallet,
        amount=xrp_to_drops(company_share)
    )
    signed = sign(await autofill(pay_tx, client), RECYCLEFI)
    await submit_and_wait(signed, client)

    return {
        "success": True,
        "purchase_id": item["purchase_id"],
        "nft_id": item["nft_id"],
        "total_price_xrp": price_xrp,
        "company_received_xrp": round(company_share, 6),
        "locked_in_amm_xrp": item["deposit_xrp"],
        "protocol_fee_xrp": round(price_xrp * 0.01, 6),
        "qr_code": item["qr_url"],
        "scan_to_recycle_url": item["recycle_url"],
        "burn_to_claim": True
    }

def product_to_response(product: Product) -> ProductResponse:
    """Convert Product model to ProductResponse"""
    # Calculate days until expiry
    days_until_expiry = None
    if product.expires_at:
        days = (product.expires_at - datetime.now(timezone.utc)).days
        days_until_expiry = max(0, days)
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        serial_number=product.serial_number,
        price=product.price,
        status=product.status.value,
        
        # Deposits
        manufacturer_deposit=product.manufacturer_deposit,
        customer_escrow=product.customer_escrow,
        total_in_amm=product.total_in_amm,
        cyclr_fee=product.cyclr_fee,
        
        # Wallets
        manufacturer_wallet=product.manufacturer_wallet,
        customer_wallet=product.customer_wallet,
        recycler_wallet=product.recycler_wallet,
        
        # NFT
        nft_id=product.nft_id,
        
        # Dates
        created_at=product.created_at,
        sold_at=product.sold_at,
        expires_at=product.expires_at,
        recycled_at=product.recycled_at,
        days_until_expiry=days_until_expiry,
        
        # Rewards
        total_withdrawn=product.total_withdrawn,
        apy_earned=product.apy_earned,
        customer_received=product.customer_received,
        manufacturer_received=product.manufacturer_received,
        recycler_received=product.recycler_received,
        eco_fund_received=product.eco_fund_received,
        cyclr_received=product.cyclr_received
    )


# ========================================
# HEALTH & INFO ENDPOINTS
# ========================================

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Check API health and XRPL connection"""
    amm_info = await xrpl_service.get_amm_info()
    
    return HealthResponse(
        status="healthy",
        cyclr_wallet=settings.CYCLR_WALLET,
        cusd_issuer=settings.CUSD_ISSUER,
        amm_available=amm_info.get("success", False)
    )


@app.get("/api/v1/amm/info", response_model=AMMInfoResponse)
async def get_amm_info():
    """Get current AMM pool information"""
    amm_info = await xrpl_service.get_amm_info()
    
    if not amm_info.get("success"):
        return AMMInfoResponse(
            success=False,
            error=amm_info.get("error", "AMM not available")
        )
    
    return AMMInfoResponse(
        success=True,
        amm_account=amm_info.get("amm_account"),
        xrp_pool=amm_info.get("xrp_pool", 0),
        cusd_pool=amm_info.get("cusd_pool", 0),
        trading_fee_percent=amm_info.get("trading_fee", 0)
    )


@app.get("/api/v1/wallet/{address}")
async def get_wallet_balance(address: str):
    """Get wallet balance (XRP and CUSD)"""
    balance = await xrpl_service.get_account_balance(address)
    return balance


# ========================================
# STEP 1: MANUFACTURER REGISTRATION
# ========================================

@app.post("/api/v1/products/register", response_model=ProductResponse)
async def register_product(request: RegisterProductRequest):
    """
    STEP 1: Manufacturer registers a product.
    
    Process:
    1. Manufacturer deposits 5% of product price to AMM
    2. Product is registered with status REGISTERED
    3. Waiting for sale or recall/expire
    
    Example: Product price = 1000 CUSD
    - Manufacturer deposit = 50 CUSD (5%)
    - Deposit goes to AMM → earns APY
    """
    
    # Calculate manufacturer deposit
    manufacturer_deposit = request.price * (MANUFACTURER_DEPOSIT_PERCENT / 100)
    
    # Create product record
    product = Product(
        name=request.name,
        description=request.description,
        serial_number=request.serial_number,
        price=request.price,
        manufacturer_deposit=manufacturer_deposit,
        total_in_amm=manufacturer_deposit,
        manufacturer_wallet=request.manufacturer_wallet
    )
    
    # Deposit manufacturer's 5% to AMM
    amm_result = await xrpl_service.deposit_to_amm(
        cusd_amount=manufacturer_deposit,
        product_id=product.id,
        deposit_type="manufacturer"
    )
    
    if amm_result.get("success"):
        product.manufacturer_lp_tokens = amm_result.get("lp_tokens_received", 0)
        product.total_lp_tokens = product.manufacturer_lp_tokens
        product.registration_tx = amm_result.get("tx_hash")
    else:
        # Log error but still create product
        print(f"⚠️ AMM deposit failed: {amm_result.get('error')}")
    
    # Save product
    save_product(product)
    
    print(f"✅ Product registered: {product.name} (ID: {product.id})")
    print(f"   Price: {product.price} CUSD")
    print(f"   Manufacturer deposit: {manufacturer_deposit} CUSD → AMM")
    
    return product_to_response(product)


# ========================================
# STEP 2: SALE
# ========================================

@app.post("/api/v1/products/{product_id}/sell", response_model=ProductResponse)
async def sell_product(product_id: str, request: SellProductRequest):
    """
    STEP 2: Customer buys the product.
    
    Process:
    1. Customer pays: product price + 5% escrow
    2. CYCLR takes 1% fee
    3. Manufacturer receives 99% of price
    4. Customer's 5% escrow goes to AMM
    
    Example: Product price = 1000 CUSD
    - Customer pays: 1000 + 50 = 1050 CUSD
    - CYCLR fee: 10 CUSD (1% of 1000)
    - Manufacturer receives: 990 CUSD (99% of 1000)
    - Customer escrow to AMM: 50 CUSD (5% of 1000)
    """
    
    product = get_product(product_id)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.status != ProductStatus.REGISTERED:
        raise HTTPException(
            status_code=400,
            detail=f"Product cannot be sold (current status: {product.status.value})"
        )
    
    # Calculate amounts
    customer_escrow = product.price * (CUSTOMER_ESCROW_PERCENT / 100)
    cyclr_fee = product.price * (CYCLR_FEE_PERCENT / 100)
    manufacturer_payment = product.price * (1 - CYCLR_FEE_PERCENT / 100)
    
    # Total customer pays: price + escrow
    total_customer_pays = product.price + customer_escrow
    
    # Update product
    product.status = ProductStatus.SOLD
    product.customer_wallet = request.customer_wallet
    product.customer_escrow = customer_escrow
    product.cyclr_fee = cyclr_fee
    product.manufacturer_payout = manufacturer_payment
    product.total_in_amm = product.manufacturer_deposit + customer_escrow
    product.sold_at = datetime.now(timezone.utc)
    # Set expiry to 6 years from now
    from models import EXPIRY_YEARS
    product.expires_at = datetime.now(timezone.utc) + timedelta(days=EXPIRY_YEARS * 365)
    
    # Deposit customer's escrow to AMM
    amm_result = await xrpl_service.deposit_to_amm(
        cusd_amount=customer_escrow,
        product_id=product.id,
        deposit_type="customer"
    )
    
    if amm_result.get("success"):
        product.customer_lp_tokens = amm_result.get("lp_tokens_received", 0)
        product.total_lp_tokens = product.manufacturer_lp_tokens + product.customer_lp_tokens
        product.sale_deposit_tx = amm_result.get("tx_hash")
    
    # Pay manufacturer (99% of price)
    # In production: await xrpl_service.pay_manufacturer(...)
    
    update_product(product)
    
    print(f"✅ Product sold: {product.name}")
    print(f"   Customer: {request.customer_wallet}")
    print(f"   Customer paid: {total_customer_pays} CUSD")
    print(f"   CYCLR fee: {cyclr_fee} CUSD")
    print(f"   Manufacturer receives: {manufacturer_payment} CUSD")
    print(f"   Customer escrow to AMM: {customer_escrow} CUSD")
    
    return product_to_response(product)


# ========================================
# PRODUCT QUERIES
# ========================================

@app.get("/api/v1/products", response_model=List[ProductResponse])
async def list_products(status: Optional[str] = None):
    """List all products, optionally filtered by status"""
    if status:
        try:
            product_status = ProductStatus(status)
            products = get_products_by_status(product_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    else:
        products = get_all_products()
    
    return [product_to_response(p) for p in products]


@app.get("/api/v1/products/{product_id}", response_model=ProductResponse)
async def get_product_details(product_id: str):
    """Get product details with current APY estimate"""
    product = get_product(product_id)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product_to_response(product)


# ========================================
# CASE A & C: RECYCLE ENDPOINT
# ========================================

# Replace BOTH recycle endpoints with this single unified one

class RecycleRequest(BaseModel):
    """Unified request model for recycling"""
    nft_id: str
    user_wallet: str  # Can be recycler or customer
    burn_tx_hash: str
    product_id: Optional[str] = None  # Optional: for product lifecycle tracking

@app.post("/api/v1/recycle")
async def recycle_product_unified(request: RecycleRequest):
    """
    UNIFIED RECYCLE ENDPOINT
    
    Handles both:
    1. Simple burn-and-claim (RecycleFi v3 flow)
    2. Product lifecycle tracking (CYCLR business logic)
    
    Process:
    1. Verify burn transaction on XRPL
    2. Withdraw LP tokens from AMM
    3. Distribute rewards (70% recycler, 20% company, 10% protocol)
    4. Update product record if product_id provided
    """
    
    nft_id = request.nft_id.strip().upper()
    user_wallet = request.user_wallet.strip()
    burn_hash = request.burn_tx_hash.strip()

    print(f"\n{'='*60}")
    print(f"[RECYCLE] Processing claim for NFT ...{nft_id[-10:]}")
    print(f"[RECYCLE] Recycler: {user_wallet}")
    print(f"[RECYCLE] Burn TX: {burn_hash[:10]}...")
    print(f"{'='*60}")

    # ========================================
    # STEP 1: VERIFY BURN TRANSACTION
    # ========================================
    try:
        tx_resp = await client.request(Tx(transaction=burn_hash))
        tx = tx_resp.result

        # Critical validations only
        if not tx.get("validated", False):
            raise ValueError("Transaction not confirmed on ledger")

        if tx.get("NFTokenID", "").upper() != nft_id:
            raise ValueError(f"NFT mismatch: expected {nft_id}, got {tx.get('NFTokenID')}")

        if tx.get("Account") != user_wallet:
            raise ValueError(f"Wallet mismatch: expected {user_wallet}, got {tx.get('Account')}")

        print(f"[RECYCLE] ✓ Burn verified on-chain")

    except Exception as e:
        print(f"[RECYCLE] ✗ Burn verification failed: {e}")
        raise HTTPException(400, f"Invalid burn transaction: {e}")

    # ========================================
    # STEP 2: WITHDRAW FROM AMM
    # ========================================
    try:
        # Get AMM info
        amm_info = await client.request(AMMInfo(asset=XRP_ASSET, asset2=CUSD_ASSET))
        lp_token = amm_info.result["amm"]["lp_token"]
        print(f"[RECYCLE] LP Token: {lp_token['currency'][:8]}...")

        # Get current LP balance
        lines = await client.request(AccountLines(account=RECYCLEFI.classic_address))
        lp_balance = 0.0
        for line in lines.result.get("lines", []):
            if (line.get("currency") == lp_token["currency"] and 
                line.get("account") == lp_token["issuer"]):
                lp_balance = float(line["balance"])
                break

        if lp_balance < 0.0001:
            raise HTTPException(400, "No LP tokens available for withdrawal")

        print(f"[RECYCLE] Withdrawing {lp_balance:.6f} LP tokens...")

        # Record XRP before withdrawal
        before = await client.request(AccountInfo(account=RECYCLEFI.classic_address))
        before_xrp = int(before.result["account_data"]["Balance"]) / 1_000_000

        # Execute withdrawal
        withdraw_tx = AMMWithdraw(
            account=RECYCLEFI.classic_address,
            asset=XRP_ASSET,
            asset2=CUSD_ASSET,
            lp_token_in=IssuedCurrencyAmount(
                currency=lp_token["currency"],
                issuer=lp_token["issuer"],
                value=str(lp_balance)
            ),
            flags=AMMWithdrawFlag.TF_WITHDRAW_ALL
        )

        signed = sign(await autofill(withdraw_tx, client), RECYCLEFI)
        withdraw_result = await submit_and_wait(signed, client)

        if withdraw_result.result["meta"]["TransactionResult"] != "tesSUCCESS":
            raise Exception(f"Withdrawal failed: {withdraw_result.result['meta']['TransactionResult']}")

        # Wait for settlement
        await asyncio.sleep(5)

        # Calculate received amount
        after = await client.request(AccountInfo(account=RECYCLEFI.classic_address))
        after_xrp = int(after.result["account_data"]["Balance"]) / 1_000_000
        received_xrp = max(0.01, after_xrp - before_xrp)

        print(f"[RECYCLE] ✓ Withdrew {received_xrp:.4f} XRP from AMM")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[RECYCLE] ✗ AMM withdrawal failed: {e}")
        raise HTTPException(500, f"Withdrawal failed: {e}")

    # ========================================
    # STEP 3: DISTRIBUTE REWARDS
    # ========================================
    
    # Find deposit to get company wallet
    deposit = await find_deposit_by_nft_id(nft_id)
    company_wallet = None
    
    if deposit:
        # Try to extract company wallet from memo or transaction
        tx_data = deposit.get("tx", {})
        # You might need to adjust this based on how you store company wallet
        # For now, using a fallback
        company_wallet = Wallet.from_seed("sEd71jnhCy64g8kpBYzkfddYfRyQCHZ").classic_address
    else:
        # Fallback company wallet
        company_wallet = Wallet.from_seed("sEd71jnhCy64g8kpBYzkfddYfRyQCHZ").classic_address

    # Calculate distribution
    recycler_reward = received_xrp * 0.70
    company_bonus = received_xrp * 0.20
    protocol_fee = received_xrp * 0.10

    print(f"[RECYCLE] Distributing rewards:")
    print(f"          Recycler (70%): {recycler_reward:.4f} XRP")
    print(f"          Company (20%):  {company_bonus:.4f} XRP")
    print(f"          Protocol (10%): {protocol_fee:.4f} XRP")

    async def pay(to: str, amount: float, label: str):
        """Helper to send payment"""
        if amount < 0.0001:
            return None
        
        payment_tx = Payment(
            account=RECYCLEFI.classic_address,
            destination=to,
            amount=xrp_to_drops(amount)
        )
        signed = sign(await autofill(payment_tx, client), RECYCLEFI)
        result = await submit_and_wait(signed, client)
        tx_hash = result.result["hash"]
        print(f"          → {label}: {amount:.4f} XRP (TX: {tx_hash[:10]}...)")
        return tx_hash

    # Execute payments
    tx_hashes = {}
    tx_hashes["recycler"] = await pay(user_wallet, recycler_reward, "Recycler")
    tx_hashes["company"] = await pay(company_wallet, company_bonus, "Company")
    tx_hashes["protocol"] = await pay(RECYCLEFI.classic_address, protocol_fee, "Protocol")

    # ========================================
    # STEP 4: UPDATE PRODUCT RECORD (if provided)
    # ========================================
    product_data = None
    if request.product_id:
        try:
            product = get_product(request.product_id)
            if product:
                # Determine case based on product status
                was_sold = product.status == ProductStatus.SOLD
                case = "A" if was_sold else "C"
                
                # Update product
                product.status = ProductStatus.RECYCLED
                product.recycled_at = datetime.now(timezone.utc)
                product.recycler_wallet = user_wallet
                product.total_withdrawn = received_xrp
                product.apy_earned = max(0, received_xrp - product.total_in_amm)
                product.recycler_received = recycler_reward
                product.recycle_tx = burn_hash
                
                update_product(product)
                
                product_data = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "case": case,
                    "status": product.status.value
                }
                
                print(f"[RECYCLE] ✓ Product record updated (Case {case})")
        except Exception as e:
            print(f"[RECYCLE] ⚠ Failed to update product record: {e}")
            # Don't fail the entire operation if product update fails

    # ========================================
    # RESPONSE
    # ========================================
    print(f"{'='*60}")
    print(f"[RECYCLE] ✅ RECYCLING COMPLETE")
    print(f"{'='*60}\n")

    return {
        "success": True,
        "nft_id": nft_id,
        "recycler_wallet": user_wallet,
        "burn_tx_hash": burn_hash,
        
        # Financial details
        "total_withdrawn_xrp": round(received_xrp, 4),
        "distribution": {
            "recycler_reward_xrp": round(recycler_reward, 4),
            "company_bonus_xrp": round(company_bonus, 4),
            "protocol_fee_xrp": round(protocol_fee, 4)
        },
        
        # Transaction hashes
        "tx_hashes": {
            "burn": burn_hash,
            "withdrawal": withdraw_result.result["hash"],
            **tx_hashes
        },
        
        # Product lifecycle (if applicable)
        "product": product_data,
        
        "message": "♻️ Recycling successful! Rewards distributed."
    }

# ========================================
# CASE B & D: EXPIRE ENDPOINT
# ========================================

@app.post("/api/v1/products/{product_id}/expire", response_model=RecycleResponse)
async def expire_product(product_id: str):
    """
    Expire a product - handles CASE B and CASE D.
    
    CASE B: Product was SOLD → expires without recycling
    - Withdraw both deposits + APY from AMM
    - Return manufacturer deposit (5%)
    - Return customer escrow (5%)
    - CYCLR keeps 100% of APY
    
    CASE D: Product was REGISTERED (never sold) → expires
    - Withdraw manufacturer deposit + APY from AMM
    - Return manufacturer deposit (5%)
    - CYCLR keeps 100% of APY
    """
    
    product = get_product(product_id)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.status not in [ProductStatus.REGISTERED, ProductStatus.SOLD]:
        raise HTTPException(
            status_code=400,
            detail=f"Product cannot be expired (current status: {product.status.value})"
        )
    
    if product.total_lp_tokens <= 0:
        raise HTTPException(
            status_code=400,
            detail="No LP tokens available for withdrawal"
        )
    
    was_sold = product.status == ProductStatus.SOLD
    
    # Step 1: Withdraw from AMM
    withdraw_result = await xrpl_service.withdraw_from_amm(
        lp_tokens=product.total_lp_tokens,
        product_id=product.id
    )
    
    if not withdraw_result.get("success"):
        return RecycleResponse(
            success=False,
            product_id=product.id,
            case="B" if was_sold else "D",
            total_withdrawn=0,
            apy_earned=0,
            distribution={},
            tx_hashes={},
            error=withdraw_result.get("error", "AMM withdrawal failed")
        )
    
    # Calculate total and APY
    total_withdrawn = withdraw_result.get("cusd_received", 0)
    total_deposits = product.manufacturer_deposit + product.customer_escrow
    apy_earned = max(0, total_withdrawn - total_deposits)
    
    # Step 2: Distribute based on case
    distribution = {}
    tx_hashes = {"withdrawal": withdraw_result.get("tx_hash", "")}
    
    if was_sold:
        # CASE B: Sold but NOT recycled
        print(f"📦 CASE B: Sold product expired without recycling")
        
        # Return deposits
        distribution["manufacturer_deposit_return"] = product.manufacturer_deposit
        distribution["customer_escrow_return"] = product.customer_escrow
        
        # CYCLR keeps 100% APY
        distribution["cyclr_apy"] = apy_earned
        
        # Store distribution
        product.manufacturer_received = distribution["manufacturer_deposit_return"]
        product.customer_received = distribution["customer_escrow_return"]
        product.cyclr_received = apy_earned
        
    else:
        # CASE D: Not sold, expired
        print(f"📦 CASE D: Unsold product expired")
        
        # Return manufacturer deposit
        distribution["manufacturer_deposit_return"] = product.manufacturer_deposit
        
        # CYCLR keeps 100% APY
        distribution["cyclr_apy"] = apy_earned
        
        # Store distribution
        product.manufacturer_received = distribution["manufacturer_deposit_return"]
        product.cyclr_received = apy_earned
    
    # Update product
    product.status = ProductStatus.EXPIRED
    product.total_withdrawn = total_withdrawn
    product.apy_earned = apy_earned
    
    update_product(product)
    
    case = "B" if was_sold else "D"
    print(f"⏰ Product expired (Case {case}): {product.name}")
    print(f"   Total withdrawn: {total_withdrawn} CUSD")
    print(f"   APY earned (CYCLR keeps): {apy_earned} CUSD")
    
    return RecycleResponse(
        success=True,
        product_id=product.id,
        case=case,
        total_withdrawn=total_withdrawn,
        apy_earned=apy_earned,
        distribution=distribution,
        tx_hashes=tx_hashes
    )


# ========================================
# RECALL (Manufacturer pulls product back)
# ========================================

@app.post("/api/v1/products/{product_id}/recall", response_model=ProductResponse)
async def recall_product(product_id: str, request: RecallProductRequest):
    """
    Manufacturer recalls an unsold product.
    
    Only works if product is REGISTERED (never sold).
    - Withdraw manufacturer deposit from AMM
    - Return deposit + any APY to manufacturer
    - Mark product as RECALLED
    """
    
    product = get_product(product_id)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.status != ProductStatus.REGISTERED:
        raise HTTPException(
            status_code=400,
            detail=f"Only REGISTERED products can be recalled (current: {product.status.value})"
        )
    
    # Verify manufacturer (product_id is in request for validation)
    if request.product_id != product_id:
        raise HTTPException(
            status_code=400,
            detail="Product ID mismatch"
        )
    
    # Withdraw from AMM
    if product.total_lp_tokens > 0:
        withdraw_result = await xrpl_service.withdraw_from_amm(
            lp_tokens=product.total_lp_tokens,
            product_id=product.id
        )
        
        if withdraw_result.get("success"):
            total_back = withdraw_result.get("cusd_received", 0)
            product.total_withdrawn = total_back
            product.apy_earned = total_back - product.manufacturer_deposit
            product.manufacturer_received = total_back
            print(f"   Returned to manufacturer: {total_back} CUSD")
    
    # Update product
    product.status = ProductStatus.RECALLED
    update_product(product)
    
    print(f"🔙 Product recalled: {product.name}")
    
    return product_to_response(product)


# ========================================
# DEMO/TEST ENDPOINTS
# ========================================

@app.post("/api/v1/demo/full-lifecycle")
async def demo_full_lifecycle(
    product_name: str = "Demo Laptop",
    price: float = 1000.0
):
    """
    Demo endpoint to show the complete product lifecycle.
    Simulates all 4 cases without actual XRPL transactions.
    """
    manufacturer_deposit = price * (MANUFACTURER_DEPOSIT_PERCENT / 100)
    customer_escrow = price * (CUSTOMER_ESCROW_PERCENT / 100)
    cyclr_fee = price * (CYCLR_FEE_PERCENT / 100)
    manufacturer_receives = price * (1 - CYCLR_FEE_PERCENT / 100)
    
    # Simulated APY (e.g., 5% annual, ~30 days)
    simulated_apy = (manufacturer_deposit + customer_escrow) * 0.05 * (30/365)
    
    return {
        "product": product_name,
        "price": price,
        
        "step_1_registration": {
            "description": "Manufacturer registers product",
            "manufacturer_deposit_to_amm": manufacturer_deposit,
            "product_status": "REGISTERED"
        },
        
        "step_2_sale": {
            "description": "Customer buys product",
            "customer_pays": price + customer_escrow,
            "cyclr_fee": cyclr_fee,
            "manufacturer_receives": manufacturer_receives,
            "customer_escrow_to_amm": customer_escrow,
            "product_status": "SOLD"
        },
        
        "total_in_amm": {
            "manufacturer_deposit": manufacturer_deposit,
            "customer_escrow": customer_escrow,
            "total": manufacturer_deposit + customer_escrow,
            "estimated_apy_30_days": round(simulated_apy, 2)
        },
        
        "case_A_sold_and_recycled": {
            "description": "Best case - product sold and recycled",
            "manufacturer_gets": f"{manufacturer_deposit} (deposit) + {round(simulated_apy * APY_MANUFACTURER_SHARE, 2)} (20% APY)",
            "customer_gets": f"{customer_escrow} (escrow) + {round(simulated_apy * APY_USER_SHARE, 2)} (40% APY)",
            "recycler_gets": f"{round(simulated_apy * APY_RECYCLER_SHARE, 2)} (20% APY)",
            "eco_fund_gets": f"{round(simulated_apy * APY_ECO_FUND_SHARE, 2)} (20% APY)"
        },
        
        "case_B_sold_not_recycled": {
            "description": "Product sold but expires",
            "manufacturer_gets": f"{manufacturer_deposit} (deposit returned)",
            "customer_gets": f"{customer_escrow} (escrow returned)",
            "cyclr_keeps": f"{round(simulated_apy, 2)} (100% APY)"
        },
        
        "case_C_not_sold_recycled": {
            "description": "Product never sold, manufacturer recycles",
            "manufacturer_gets": f"{manufacturer_deposit} (deposit) + {round(simulated_apy * 0.5, 2)} (50% APY)",
            "cyclr_keeps": f"{round(simulated_apy * 0.5, 2)} (50% APY)"
        },
        
        "case_D_not_sold_expired": {
            "description": "Product never sold, expires",
            "manufacturer_gets": f"{manufacturer_deposit} (deposit returned)",
            "cyclr_keeps": f"{round(simulated_apy, 2)} (100% APY)"
        }
    }


@app.post("/api/v1/demo/simulate-case-a")
async def demo_case_a(
    product_name: str = "Demo Phone",
    price: float = 500.0,
    manufacturer_wallet: str = "rManufacturer123",
    customer_wallet: str = "rCustomer456",
    recycler_wallet: str = "rRecycler789"
):
    """
    Simulate CASE A: Product is sold and recycled.
    Creates a product, marks as sold, then recycles it.
    """
    manufacturer_deposit = price * (MANUFACTURER_DEPOSIT_PERCENT / 100)
    customer_escrow = price * (CUSTOMER_ESCROW_PERCENT / 100)
    cyclr_fee = price * (CYCLR_FEE_PERCENT / 100)
    
    # Create product
    product = Product(
        name=product_name,
        price=price,
        manufacturer_deposit=manufacturer_deposit,
        manufacturer_wallet=manufacturer_wallet,
        manufacturer_lp_tokens=manufacturer_deposit * 0.98  # Simulated
    )
    
    # Simulate sale
    product.status = ProductStatus.SOLD
    product.customer_wallet = customer_wallet
    product.customer_escrow = customer_escrow
    product.cyclr_fee = cyclr_fee
    product.total_in_amm = manufacturer_deposit + customer_escrow
    product.sold_at = datetime.now(timezone.utc)
    product.customer_lp_tokens = customer_escrow * 0.98
    product.total_lp_tokens = product.manufacturer_lp_tokens + product.customer_lp_tokens
    
    # Simulate recycle with APY
    simulated_apy = (manufacturer_deposit + customer_escrow) * 0.05 * (30/365)
    product.status = ProductStatus.RECYCLED
    product.recycled_at = datetime.now(timezone.utc)
    product.recycler_wallet = recycler_wallet
    product.apy_earned = simulated_apy
    product.total_withdrawn = manufacturer_deposit + customer_escrow + simulated_apy
    
    # Distribute
    product.customer_received = customer_escrow + (simulated_apy * APY_USER_SHARE)
    product.manufacturer_received = manufacturer_deposit + (simulated_apy * APY_MANUFACTURER_SHARE)
    product.recycler_received = simulated_apy * APY_RECYCLER_SHARE
    product.eco_fund_received = simulated_apy * APY_ECO_FUND_SHARE
    
    save_product(product)
    
    return {
        "message": "CASE A simulated: Sold & Recycled",
        "product_id": product.id,
        "distributions": {
            "manufacturer_total": product.manufacturer_received,
            "customer_total": product.customer_received,
            "recycler": product.recycler_received,
            "eco_fund": product.eco_fund_received
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
