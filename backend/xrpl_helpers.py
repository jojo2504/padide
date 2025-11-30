# xrpl_helpers.py — FIXED: RecycleFi receives payment first, then distributes

import os
import qrcode
from datetime import datetime, timedelta
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.models import (
    NFTokenMint, NFTokenMintFlag, Memo,
    AMMDeposit, AMMDepositFlag, IssuedCurrencyAmount,
    Payment  # ← Added for company payment
)

from xrpl.models.currencies import XRP, IssuedCurrency
from xrpl.asyncio.transaction import autofill, sign, submit_and_wait
from xrpl.utils import xrp_to_drops
from config import settings

client = AsyncJsonRpcClient(settings.RPC_URL)

# CUSD — Our stablecoin for the circular economy
CUSD_HEX = "4355534400000000000000000000000000000000"
CUSD_ISSUER = "rpWYyReCdfisZEd99q14gg96NrAEpcauMt"

# WE ARE RECYCLEFI — this is our master wallet
def get_recyclefi_wallet():
    from xrpl.wallet import Wallet
    if not settings.RECYCLEFI_SEED:
        raise ValueError("RECYCLEFI_SEED is missing in .env!")
    wallet = Wallet.from_seed(settings.RECYCLEFI_SEED.strip())
    print(f"RECYCLEFI WALLET LOADED: {wallet.classic_address}")
    return wallet

RECYCLEFI = get_recyclefi_wallet()

# Assets
XRP_ASSET = XRP()
CUSD_ASSET = IssuedCurrency(currency=CUSD_HEX, issuer=CUSD_ISSUER)


def _extract_nft_id_from_meta(response_result: dict) -> str:
    """Extract minted NFTokenID from submit_and_wait() response"""
    meta = response_result.get("meta")
    if not meta:
        raise ValueError("No 'meta' in transaction response")

    if isinstance(meta, str):
        import json
        meta = json.loads(meta)

    affected = meta.get("AffectedNodes", [])
    for node in affected:
        if "CreatedNode" in node:
            created = node["CreatedNode"]
            if created.get("LedgerEntryType") == "NFTokenPage":
                nftokens = created.get("NewFields", {}).get("NFTokens", [])
                if nftokens:
                    return nftokens[0]["NFToken"]["NFTokenID"]

        if "ModifiedNode" in node:
            modified = node["ModifiedNode"]
            if modified.get("LedgerEntryType") == "NFTokenPage":
                final_fields = modified.get("FinalFields", {}).get("NFTokens", [])
                for token_entry in final_fields:
                    if "NFToken" in token_entry:
                        return token_entry["NFToken"]["NFTokenID"]

    raise ValueError(f"NFT ID not found in meta: {meta}")


async def create_recyclable_item_v3(
    product_name: str,
    price_xrp: float,
    deposit_percent: float = 6.0,
    company_wallet: str | None = None,
    consumer_wallet: str | None = None
) -> dict:
    """
    FIXED FLOW: Consumer → RecycleFi → Company
    
    1. Consumer sends full price to RecycleFi (handled externally or assumed)
    2. RecycleFi locks deposit into AMM
    3. RecycleFi pays company their share (93%)
    4. RecycleFi keeps protocol fee (7%)
    5. RecycleFi mints NFT and generates QR
    
    NOTE: In production, step 1 should be an actual Payment transaction from consumer.
    For now, we assume RecycleFi already has the funds.
    """
    
    if not company_wallet:
        raise ValueError("Company wallet is required")
    
    deposit_xrp = round(price_xrp * (deposit_percent / 100), 6)
    cusd_amount = deposit_xrp
    
    # NEW: Calculate distributions (RecycleFi already has the 5 XRP)
    company_share = price_xrp * 0.93      # 93% to company (was 94%, now 93% to balance fees)
    protocol_fee = price_xrp * 0.07       # 7% RecycleFi keeps (deposit 6% + operating 1%)
    
    print(f"\n=== RECYCLEFI PURCHASE FLOW ===")
    print(f"Product: {product_name}")
    print(f"Total Price: {price_xrp} XRP (already in RecycleFi wallet)")
    print(f"")
    print(f"DISTRIBUTION:")
    print(f"  → AMM Deposit: {deposit_xrp} XRP + {cusd_amount} CUSD (locked for yield)")
    print(f"  → Company Payment: {company_share:.6f} XRP (sending now...)")
    print(f"  → RecycleFi Fee: {protocol_fee:.6f} XRP (kept in our wallet)")
    print(f"")

    # Step 1: Mint the recycling NFT (proof of deposit)
    print("[1/4] Minting Recycling NFT...")

    # AUTO-RECYCLE IN 30 DAYS — THIS IS THE MAGIC // to change
    expiry_timestamp = int((datetime.now() + timedelta(days=30)).timestamp())
    print(f"AUTO-RECYCLE ENABLED: NFT expires in 30 days → anyone can burn & claim")

    mint_tx = NFTokenMint(
        account=RECYCLEFI.classic_address,
        nftoken_taxon=2025,
        flags=NFTokenMintFlag.TF_TRANSFERABLE | NFTokenMintFlag.TF_BURNABLE,
        uri=f"ipfs://recyclefi/{product_name.lower().replace(' ', '-')}".encode().hex(),
        # uri="697066733A2F2F72656379636C6566692D7633",
        amount="0",
        expiration=expiry_timestamp  # ← THIS IS THE AUTO-RECYCLE TRIGGER
    )
    signed = sign(await autofill(mint_tx, client), RECYCLEFI)
    resp = await submit_and_wait(signed, client)

    if resp.result.get("meta", {}).get("TransactionResult") != "tesSUCCESS":
        raise RuntimeError("NFT mint failed")

    nft_id = _extract_nft_id_from_meta(resp.result)
    print(f"      ✓ NFT Minted: {nft_id}")

    # Step 2: Lock deposit into AMM pool (this generates yield)
    print(f"[2/4] Locking {deposit_xrp} XRP + {cusd_amount} CUSD into AMM...")
    deposit_tx = AMMDeposit(
        account=RECYCLEFI.classic_address,
        asset=XRP_ASSET,
        asset2=CUSD_ASSET,
        amount=xrp_to_drops(deposit_xrp),
        amount2=IssuedCurrencyAmount(
            currency=CUSD_HEX, 
            issuer=CUSD_ISSUER, 
            value=str(cusd_amount)
        ),
        flags=AMMDepositFlag.TF_TWO_ASSET,
        memos=[Memo.from_dict({
            "memo_type": "4E46544944".encode().hex(),
            "memo_data": nft_id.encode().hex(),
            "memo_format": "746578742F706C61696E".encode().hex()
        })]
    )
    signed = sign(await autofill(deposit_tx, client), RECYCLEFI)
    await submit_and_wait(signed, client)
    print(f"      ✓ AMM Deposit successful — yield engine activated")

    # Step 3: PAY THE COMPANY (this is the fix!)
    print(f"[3/4] Paying company {company_share:.6f} XRP...")
    company_payment = Payment(
        account=RECYCLEFI.classic_address,
        destination=company_wallet,
        amount=xrp_to_drops(company_share)
    )
    signed = sign(await autofill(company_payment, client), RECYCLEFI)
    company_tx_result = await submit_and_wait(signed, client)
    
    if company_tx_result.result.get("meta", {}).get("TransactionResult") != "tesSUCCESS":
        raise RuntimeError(f"Company payment failed: {company_tx_result}")
    
    company_tx_hash = company_tx_result.result.get("hash")
    print(f"      ✓ Company paid! TX: {company_tx_hash}")

    # Step 4: Generate QR code for recycling
    print(f"[4/4] Generating QR code...")
    recycle_url = f"{settings.RECYCLE_DAPP_URL}?nft={nft_id}"
    img = qrcode.make(recycle_url)
    os.makedirs("qrcodes", exist_ok=True)
    filename = f"QR_{nft_id[-8:]}.png"
    path = os.path.join("qrcodes", filename)
    img.save(path)
    print(f"      ✓ QR Code: {path}")
    print(f"      ✓ Recycle URL: {recycle_url}")
    
    print(f"\n✅ PURCHASE COMPLETE")
    print(f"   NFT: {nft_id}")
    print(f"   Company received: {company_share:.6f} XRP")
    print(f"   RecycleFi kept: {protocol_fee:.6f} XRP")
    print(f"   Locked in AMM: {deposit_xrp} XRP + {cusd_amount} CUSD")
    print(f"   Company TX: https://test.bithomp.com/explorer/{company_tx_hash}\n")

    return {
        "purchase_id": f"RECYCLEFI-{int(datetime.now().timestamp())}",
        "nft_id": nft_id,
        "deposit_xrp": deposit_xrp,
        "company_received_xrp": company_share,
        "protocol_fee_xrp": protocol_fee,
        "company_tx_hash": company_tx_hash,
        "qr_path": path,
        "qr_url": f"/qrcodes/{filename}",
        "recycle_url": recycle_url
    }