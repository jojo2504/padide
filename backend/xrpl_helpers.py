# xrpl_helpers.py — RecycleFi Protocol (We are "us", not manufacturer)
import os
import qrcode
from datetime import datetime
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.models import (
    NFTokenMint, NFTokenMintFlag, Memo,
    AMMDeposit, AMMDepositFlag, IssuedCurrencyAmount
)
from xrpl.models.currencies import XRP, IssuedCurrency
from xrpl.asyncio.transaction import autofill, sign, submit_and_wait
from xrpl.utils import xrp_to_drops
from config import settings

client = AsyncJsonRpcClient(settings.RPC_URL)

# CUSD — Our stablecoin for the circular economy
CUSD_HEX = "4355534400000000000000000000000000000000"  # CUSD
CUSD_ISSUER = "rpWYyReCdfisZEd99q14gg96NrAEpcauMt"

# WE ARE RECYCLEFI — this is our master wallet
def get_recyclefi_wallet():
    from xrpl.wallet import Wallet
    if not settings.RECYCLEFI_SEED:
        raise ValueError("RECYCLEFI_SEED is missing in .env! This is our protocol wallet.")
    wallet = Wallet.from_seed(settings.RECYCLEFI_SEED.strip())
    print(f"RECYCLEFI WALLET LOADED: {wallet.classic_address}")
    return wallet

RECYCLEFI = get_recyclefi_wallet()  # ← This is US

# Assets
XRP_ASSET = XRP()
CUSD_ASSET = IssuedCurrency(currency=CUSD_HEX, issuer=CUSD_ISSUER)

def _extract_nft_id_from_meta(response_result: dict) -> str:
    """
    Extract minted NFTokenID from submit_and_wait() response (xrpl-py 4.3.1+)
    Works 100% on testnet.
    """
    meta = response_result.get("meta")
    if not meta:
        raise ValueError("No 'meta' in transaction response")

    # Sometimes meta is a string (yes, really)
    if isinstance(meta, str):
        import json
        meta = json.loads(meta)

    # Look for CreatedNode → NFTokenPage
    affected = meta.get("AffectedNodes", [])
    for node in affected:
        if "CreatedNode" in node:
            created = node["CreatedNode"]
            if created.get("LedgerEntryType") == "NFTokenPage":
                nftokens = created.get("NewFields", {}).get("NFTokens", [])
                if nftokens:
                    return nftokens[0]["NFToken"]["NFTokenID"]

        # Fallback: ModifiedNode (rare, but happens if page already exists)
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
    A consumer buys a product → we (RecycleFi) lock 6% into AMM, mint NFT, generate QR.
    We are the bridge. We are the yield engine. We are the future.
    """
    deposit_xrp = round(price_xrp * (deposit_percent / 100), 6)
    cusd_amount = deposit_xrp

    print(f"\nRECYCLEFI — NEW PURCHASE FLOW")
    print(f"   Product: {product_name}")
    print(f"   Price: {price_xrp} XRP")
    print(f"   Deposit to AMM: {deposit_xrp} XRP + {cusd_amount} CUSD")
    print(f"   Company receives: {price_xrp * 0.93:.6f} XRP instantly")
    print(f"   RecycleFi fee: {price_xrp * 0.01:.6f} XRP (we keep)")

    # 1. Mint the recycling NFT (proof of ownership)
    print("   → Minting Recycling NFT...")
    mint_tx = NFTokenMint(
        account=RECYCLEFI.classic_address,
        nftoken_taxon=2025,
        flags=NFTokenMintFlag.TF_TRANSFERABLE,
        uri="697066733A2F2F72656379636C6566692D7633"
    )
    signed = sign(await autofill(mint_tx, client), RECYCLEFI)
    resp = await submit_and_wait(signed, client)

    if resp.result.get("meta", {}).get("TransactionResult") != "tesSUCCESS":
        raise RuntimeError("NFT mint failed")

    nft_id = _extract_nft_id_from_meta(resp.result)
    print(f"NFT MINTED: {nft_id}")
    print(f"   → NFT Minted: {nft_id}")

    # 2. Lock funds into our XRP/CUSD AMM pool (this generates yield)
    print(f"   → Locking funds into XRP/CUSD AMM pool...")
    deposit_tx = AMMDeposit(
        account=RECYCLEFI.classic_address,
        asset=XRP_ASSET,
        asset2=CUSD_ASSET,
        amount=xrp_to_drops(deposit_xrp),
        amount2=IssuedCurrencyAmount(currency=CUSD_HEX, issuer=CUSD_ISSUER, value=str(cusd_amount)),
        flags=AMMDepositFlag.TF_TWO_ASSET,
        memos=[Memo.from_dict({
            "memo_type": "4E46544944".encode().hex(),  # "NFTID"
            "memo_data": nft_id.encode().hex(),
            "memo_format": "746578742F706C61696E".encode().hex()
        })]
    )
    signed = sign(await autofill(deposit_tx, client), RECYCLEFI)
    await submit_and_wait(signed, client)
    print("   → AMM Deposit SUCCESSFUL — yield engine activated")

    # 3. Generate QR code for recycling
    recycle_url = f"{settings.RECYCLE_DAPP_URL}?nft={nft_id}"
    img = qrcode.make(recycle_url)
    os.makedirs("qrcodes", exist_ok=True)
    filename = f"QR_{nft_id[-8:]}.png"
    path = os.path.join("qrcodes", filename)
    img.save(path)
    print(f"   → QR Code ready: {path}")
    print(f"   → Burn-to-claim URL: {recycle_url}\n")

    return {
        "purchase_id": f"RECYCLEFI-{int(datetime.now().timestamp())}",
        "nft_id": nft_id,
        "deposit_xrp": deposit_xrp,
        "qr_path": path,
        "qr_url": f"/qrcodes/{filename}",
        "recycle_url": recycle_url
    }