# main.py — RecycleFi v3 — Burn NFT to Claim AMM Yield (No State, Infinite Scale)
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
from xrpl.models.requests import AccountTx, AMMInfo, Tx
from xrpl.models.currencies import XRP, IssuedCurrency
from xrpl.utils import xrp_to_drops
from xrpl.wallet import Wallet

from xrpl_helpers import client, RECYCLEFI, create_recyclable_item_v3
from config import settings

app = FastAPI(
    title="RecycleFi v3 — Burn-to-Earn from AMM Yield",
    description="6% of purchase → AMM → Burn NFT → Claim Yield + Bonus",
    version="3.0"
)

# Stablecoin config
CUSD_HEX = "4355534400000000000000000000000000000000"  # CUSD
CUSD_ISSUER = "rpWYyReCdfisZEd99q14gg96NrAEpcauMt"
CUSD_CURRENCY = IssuedCurrencyAmount(currency=CUSD_HEX, issuer=CUSD_ISSUER, value="0")

XRP_ASSET = XRP()
CUSD_ASSET = IssuedCurrency(currency=CUSD_HEX, issuer=CUSD_ISSUER)

class BurnClaimRequest(BaseModel):
    nft_id: str           # Full NFTokenID (e.g. 000813...)
    user_wallet: str      # r...
    burn_tx_hash: str     # Hash of NFTokenBurn transaction


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


@app.post("/api/v1/recycle")
async def recycle_burn_claim(request: BurnClaimRequest):
    nft_id = request.nft_id.strip().upper()
    user_wallet = request.user_wallet.strip()
    burn_hash = request.burn_tx_hash.strip()

    if not user_wallet.startswith("r"):
        raise HTTPException(400, "Invalid wallet")

    # 1. Verify burn transaction
    try:
        tx_resp = await client.request(Tx(transaction=burn_hash))
        tx = tx_resp.result

        if tx.get("TransactionType") != "NFTokenBurn":
            raise ValueError("Not a burn")
        if not tx.get("validated", False):
            raise HTTPException(400, "Burn not confirmed yet")
        if tx["NFTokenID"].upper() != nft_id:
            raise ValueError("Wrong NFT burned")
        if tx["Account"] != user_wallet:
            raise HTTPException(403, "You didn't burn this NFT")

        print(f"NFT {nft_id[-8:]} burned by {user_wallet[:8]}...")
    except Exception as e:
        raise HTTPException(400, f"Burn verification failed: {e}")

    # 2. Find associated AMM deposit
    deposit = await find_deposit_by_nft_id(nft_id)
    if not deposit:
        raise HTTPException(404, "No deposit found for this NFT")

    # 3. Withdraw all liquidity + yield
    lp_balance = await get_lp_balance()
    if lp_balance <= 0:
        raise HTTPException(400, "No liquidity to claim")

    try:
        withdraw_tx = AMMWithdraw(
            account=RECYCLEFI.classic_address,
            asset=XRP_ASSET,        # ← OBJECT
            asset2=CUSD_ASSET,      # ← OBJECT
            lp_token_in=IssuedCurrencyAmount(
                currency=lp_token["currency"],
                issuer=lp_token["account"],
                value=str(lp_balance)
            ),
            flags=AMMWithdrawFlag.TF_WITHDRAW_ALL
        )
        filled = await autofill(withdraw_tx, client)
        signed = sign(filled, RECYCLEFI)
        result = await submit_and_wait(signed, client)

        if result.result["meta"]["TransactionResult"] != "tesSUCCESS":
            raise Exception("Withdraw failed")
    except Exception as e:
        raise HTTPException(500, f"AMM withdraw failed: {e}")

    # 4. Distribute rewards (example split)
    total_withdrawn_xrp = 0.36  # In real: calculate from balance change
    yield_earned = total_withdrawn_xrp * 0.15  # example

    recycler_reward = total_withdrawn_xrp * 0.70
    company_bonus = total_withdrawn_xrp * 0.20
    protocol_fee = total_withdrawn_xrp * 0.10

    async def send_payment(dest: str, amount: float, label: str):
        tx = Payment(
            account=RECYCLEFI.classic_address,
            destination=dest,
            amount=xrp_to_drops(amount),
            memos=[Memo.from_dict({
                "memo_data": f"RecycleFi Reward: {nft_id[-8:]}".encode().hex(),
                "memo_type": "Recycle".encode().hex()
            })]
        )
        signed = sign(await autofill(tx, client), RECYCLEFI)
        await submit_and_wait(signed, client)
        print(f"Sent {amount:.3f} XRP → {label}")

    await send_payment(user_wallet, recycler_reward, "Recycler")
    await send_payment(settings.COMPANY_WALLET, company_bonus, "Company Bonus")
    # protocol_fee stays in wallet

    return JSONResponse({
        "success": True,
        "nft_id": nft_id,
        "burn_tx": burn_hash,
        "recycler_reward_xrp": round(recycler_reward, 4),
        "company_bonus_xrp": round(company_bonus, 4),
        "protocol_fee_xrp": round(protocol_fee, 4),
        "yield_earned_xrp": round(yield_earned, 4),
        "message": "NFT burned → reward claimed from AMM yield!",
        "explorer": f"https://test.bithomp.com/explorer/{burn_hash}"
    })

@app.post("/api/v1/purchase")
async def process_circular_purchase(
    product_name: str = Form("Eco Bottle"),
    price_xrp: float = Form(5.0),
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


@app.get("/qrcodes/{filename}")
async def get_qr(filename: str):
    path = f"qrcodes/{filename}"
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(404, "QR not found")


@app.get("/")
def root():
    return {
        "project": "RecycleFi v3 — Burn-to-Earn",
        "status": "running",
        "model": "6% purchase → AMM → Burn NFT → Claim Yield",
        "proof": "NFT Burn = Permanent On-Chain Recycling Proof",
        "scale": "Infinite (zero state)",
        "docs": "/docs"
    }