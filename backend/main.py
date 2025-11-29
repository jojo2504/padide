# main.py
from fastapi import FastAPI, File, UploadFile, Form
from xrpl_helpers import client, MANUFACTURER
from xrpl.models import Payment, Memo
import xrpl.transaction
from config import settings
import shutil
import os

app = FastAPI(
    title="RecycleFi Backend",
    description="Circular Economy + DeFi on XRPL",
    version="1.0.0"
)

@app.post("/api/v1/item")
async def create_item(
    product_name: str = Form(...),
    deposit_xrp: float = Form(10.0)
):
    from xrpl_helpers import create_recyclable_item
    item = create_recyclable_item(product_name, deposit_xrp)
    return item

@app.post("/api/v1/recycle")
async def recycle_proof(
    nft_id: str = Form(...),
    file: UploadFile = File(...)
):
    os.makedirs("proofs", exist_ok=True)
    with open(f"proofs/{nft_id}.jpg", "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Trigger Hook (in production: signed by oracle)
    tx = Payment(
        account=MANUFACTURER.classic_address,
        destination=MANUFACTURER.classic_address,
        amount="1",
        memos=[Memo.from_dict({
            "memo_type": "52656379636C65".encode().hex(),  # "Recycle"
            "memo_data": nft_id.encode().hex(),
        })]
    )
    resp = xrpl.transaction.sign_and_submit(tx, wallet=MANUFACTURER, client=client)
    return {"status": "proof_accepted", "trigger_tx": resp.result["hash"]}

@app.get("/")
def root():
    return {
        "project": "RecycleFi - Recycle-to-Earn on XRPL",
        "network": settings.NETWORK,
        "ready": True
    }