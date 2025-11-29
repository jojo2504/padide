# main.py
from fastapi import FastAPI, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import xrpl.transaction
from xrpl.models import Payment, Memo, Transaction
from xrpl.utils import xrp_to_drops, drops_to_xrp
from xrpl.clients import JsonRpcClient
from typing import Optional, Set
import time
import json
import os

from xrpl_helpers import client, MANUFACTURER, create_recyclable_item
from config import settings

app = FastAPI(
    title="RecycleFi – Recycle-to-Earn Backend",
    description="QR → Instant XRP Reward on XRPL",
    version="1.0"
)

# Cache for quick lookup (in production: use Redis or DB)
RECYCLED_NFTS: Set[str] = set()

class RecycleRequest(BaseModel):
    nft_id: str
    user_wallet: str  # XRPL address from frontend (r...)
    proof_photo_url: Optional[str] = None  # Optional for demo

@app.post("/api/v1/recycle")
async def recycle_item(request: RecycleRequest):
    nft_id = request.nft_id.upper()
    user_wallet = request.user_wallet.strip()

    # 1. Basic validation
    if not user_wallet.startswith("r"):
        raise HTTPException(400, "Invalid XRPL wallet address")

    if nft_id in RECYCLED_NFTS:
        raise HTTPException(400, "This item was already recycled!")

    # 2. Find the linked Escrow via memo scanning (fast for demo)
    # In production: store escrow_sequence ↔ nft_id in DB
    escrow_info = await find_escrow_by_nft_memo(nft_id)
    if not escrow_info:
        raise HTTPException(404, "No active deposit found for this product")

    escrow_account = escrow_info["account"]
    escrow_seq = escrow_info["sequence"]
    original_deposit = float(drops_to_xrp(escrow_info["amount"]))

    # 3. Calculate reward (70% to user, 30% back to manufacturer)
    user_reward = original_deposit * (settings.RECYCLER_REWARD_PERCENT / 100)
    manufacturer_keeps = original_deposit - user_reward

    print(f"Recycling {nft_id[-8:]}")
    print(f"  → User {user_wallet[:8]}... gets {user_reward:.3f} XRP")
    print(f"  → Factory keeps {manufacturer_keeps:.3f} XRP")

    # 4. Release escrow + split funds
    try:
        # Step 1: Cancel escrow (releases full amount to issuer)
        cancel_tx = xrpl.models.EscrowCancel(
            account=MANUFACTURER.classic_address,
            owner=MANUFACTURER.classic_address,
            offer_sequence=escrow_seq
        )
        cancel_resp = xrpl.transaction.sign_and_submit(cancel_tx, MANUFACTURER, client)
        time.sleep(5)

        # Step 2: Pay user their reward
        pay_user = Payment(
            account=MANUFACTURER.classic_address,
            destination=user_wallet,
            amount=xrp_to_drops(user_reward),
            memos=[
                Memo.from_dict({
                    "memo_type": "52656379636C65".encode().hex(),  # "Recycle"
                    "memo_data": "Thanks for recycling!".encode().hex(),
                }),
                Memo.from_dict({
                    "memo_data": nft_id.encode().hex(),
                    "memo_type": "NFT".encode().hex(),
                })
            ]
        )
        pay_resp = xrpl.transaction.sign_and_submit(pay_user, MANUFACTURER, client)

        # Mark as recycled
        RECYCLED_NFTS.add(nft_id)

        return JSONResponse({
            "success": True,
            "message": "Recycled successfully! Reward sent!",
            "reward_xrp": round(user_reward, 3),
            "user_wallet": user_wallet,
            "nft_id": nft_id,
            "tx_hash_reward": pay_resp.result["hash"],
            "explorer": f"https://test.bithomp.com/explorer/{pay_resp.result['hash']}"
        })

    except Exception as e:
        raise HTTPException(500, f"Transaction failed: {str(e)}")


# Helper: Find escrow by scanning memos (works perfectly for <1000 items)
async def find_escrow_by_nft_memo(nft_id: str):
    account_tx = client.request(xrpl.models.AccountTx(
        account=MANUFACTURER.classic_address,
        limit=400
    )).result

    target = nft_id.encode().hex()

    for tx in account_tx["transactions"]:
        if tx["tx"]["TransactionType"] != "EscrowCreate":
            continue
        if "meta" not in tx or tx["meta"].get("TransactionResult") != "tesSUCCESS":
            continue

        memos = tx["tx"].get("Memos", [])
        for memo in memos:
            data = memo["Memo"].get("MemoData", "")
            if data.lower() == target.lower():
                return {
                    "account": tx["tx"]["Account"],
                    "sequence": tx["tx"]["Sequence"],
                    "amount": tx["tx"]["Amount"]
                }
    return None


@app.post("/api/v1/factory/produce")
async def factory_produce(
    product_name: str = Form("Plastic Bottle"),
    deposit_xrp: float = Form(10.0)
):
    item = create_recyclable_item(
        product_name=product_name,
        deposit_xrp=deposit_xrp
    )
    return {
        "success": True,
        "product": product_name,
        "nft_id": item["nft_id"],
        "qr_code": f"/qrcodes/{os.path.basename(item['qr_code'])}",
        "scan_to_recycle": item["scan_url"]
    }


@app.get("/")
def root():
    return {
        "project": "RecycleFi - QR Code → Instant XRP Reward",
        "status": "running",
        "network": settings.NETWORK.upper(),
        "recycler_reward": f"{settings.RECYCLER_REWARD_PERCENT}%",
        "total_recycled": len(RECYCLED_NFTS),
        "docs": "/docs"
    }