# xrpl_helpers.py — WITH TIMING ONLY (no other changes)
import os
import time
import asyncio
from typing import Optional, Any
import qrcode
from datetime import datetime, timedelta, timezone

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import (
    EscrowCreate, NFTokenMint, NFTokenMintFlag,
    Memo
)
from xrpl.asyncio.transaction import sign_and_submit
from xrpl.utils import xrp_to_drops
from xrpl.models.requests import Tx
from config import settings

# ← GLOBAL SEMAPHORE: Max 5 concurrent blockchain ops
BLOCKCHAIN_SEMAPHORE = asyncio.Semaphore(1)  # Still 1, as you requested

# Async client
client = AsyncJsonRpcClient(settings.RPC_URL)

def get_manufacturer_wallet() -> Wallet:
    if not settings.MANUFACTURER_SEED:
        raise ValueError("MANUFACTURER_SEED not set in .env")
    return Wallet.from_seed(settings.MANUFACTURER_SEED)

MANUFACTURER = get_manufacturer_wallet()

async def _extract_nft_id(result: dict[str, Any]) -> str:
    meta = result.get("meta", {})
    if isinstance(meta, str):
        import json
        meta = json.loads(meta)

    for node in meta.get("AffectedNodes", []):
        created = node.get("CreatedNode", {})
        if created.get("LedgerEntryType") == "NFTokenPage":
            tokens = created.get("NewFields", {}).get("NFTokens", [])
            if tokens:
                return tokens[0]["NFToken"]["NFTokenID"]
        
        modified = node.get("ModifiedNode", {})
        if modified.get("LedgerEntryType") == "NFTokenPage":
            final = modified.get("FinalFields", {}).get("NFTokens", [])
            if final:
                return final[-1]["NFToken"]["NFTokenID"]

    raise ValueError("NFT ID not found")

async def create_recyclable_item(
    product_name: str,
    deposit_xrp: Optional[float] = None,
    recycler_percent: Optional[int] = None,
    years: Optional[int] = None
):
    # Total timer
    total_start = time.perf_counter()

    deposit_xrp = deposit_xrp or settings.DEFAULT_DEPOSIT_XRP
    recycler_percent = recycler_percent or settings.RECYCLER_REWARD_PERCENT
    years = years or settings.ESCROW_YEARS

    async with BLOCKCHAIN_SEMAPHORE:
        print(f"\nStarting mint for: {product_name}")

        # 1. Mint NFT — timing starts
        mint_start = time.perf_counter()

        mint_tx = NFTokenMint(
            account=MANUFACTURER.classic_address,
            nftoken_taxon=6969,
            flags=NFTokenMintFlag.TF_TRANSFERABLE,
            uri=f"recyclefi://{product_name.lower().replace(' ', '-')}".encode().hex(),
            memos=[
                Memo.from_dict({
                    "memo_data": product_name.encode().hex(),
                    "memo_format": "text/plain".encode().hex(),
                    "memo_type": "Product".encode().hex(),
                }),
                Memo.from_dict({
                    "memo_data": str(recycler_percent).encode().hex(),
                    "memo_type": "RecyclerReward%".encode().hex(),
                })
            ]
        )

        response = await sign_and_submit(mint_tx, wallet=MANUFACTURER, client=client)
        tx_hash = response.result["tx_json"]["hash"]
        print(f"NFT submitted → {tx_hash[:8]}...")

        # Wait for validation
        nft_id = None
        poll_start = time.perf_counter()
        for i in range(15):
            await asyncio.sleep(1)
            tx_resp = await client.request(Tx(transaction=tx_hash))
            if tx_resp.is_successful() and tx_resp.result.get("validated"):
                nft_id = await _extract_nft_id(tx_resp.result)
                poll_time = time.perf_counter() - poll_start
                mint_total_time = time.perf_counter() - mint_start
                print(f"NFT minted: {nft_id[-8:]} | Mint+Wait: {mint_total_time:.2f}s (polling took {poll_time:.2f}s)")
                break
        else:
            raise RuntimeError("NFT mint timeout")

        # 2. Create Escrow — timing
        escrow_start = time.perf_counter()

        finish_time = int((datetime.now(timezone.utc) + timedelta(days=years * 365)).timestamp())
        escrow_tx = EscrowCreate(
            account=MANUFACTURER.classic_address,
            amount=xrp_to_drops(deposit_xrp),
            destination=MANUFACTURER.classic_address,
            finish_after=finish_time,
            memos=[
                Memo.from_dict({"memo_data": nft_id.encode().hex(), "memo_type": "LinkedNFT".encode().hex()}),
                Memo.from_dict({"memo_data": "RecycleFiDeposit".encode().hex()})
            ]
        )

        escrow_resp = await sign_and_submit(escrow_tx, wallet=MANUFACTURER, client=client)
        escrow_seq = escrow_resp.result["tx_json"]["Sequence"]
        escrow_time = time.perf_counter() - escrow_start
        print(f"Escrow created → seq {escrow_seq} | Time: {escrow_time:.2f}s")

        # 3. Generate QR Code — timing
        qr_start = time.perf_counter()
        recycle_url = f"{settings.RECYCLE_DAPP_URL}?nft={nft_id}&escrow={escrow_seq}"
        img = qrcode.make(recycle_url)
        os.makedirs("qrcodes", exist_ok=True)
        qr_path = f"qrcodes/{product_name.replace(' ', '_')}_{nft_id[-8:]}.png"
        img.save(qr_path)
        qr_time = time.perf_counter() - qr_start
        print(f"QR code saved → {qr_path} | Time: {qr_time:.3f}s")

        # Final total time
        total_time = time.perf_counter() - total_start
        print(f"COMPLETED: {product_name} | Total time: {total_time:.2f}s | {deposit_xrp} XRP locked")

        return {
            "product": product_name,
            "nft_id": nft_id,
            "escrow_sequence": escrow_seq,
            "deposit_xrp": deposit_xrp,
            "recycler_gets_%": recycler_percent,
            "expires_in_years": years,
            "qr_code": qr_path,
            "scan_url": recycle_url,
            "timing_seconds": {
                "nft_mint_and_wait": round(mint_total_time, 2),
                "escrow_create": round(escrow_time, 2),
                "qr_generate": round(qr_time, 3),
                "total": round(total_time, 2)
            }
        }