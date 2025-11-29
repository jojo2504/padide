# xrpl_helpers.py
import os
import time

from typing import Optional, Any
import qrcode
import datetime
from datetime import datetime, timedelta, timezone
from xrpl.clients import JsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import (
    EscrowCreate, NFTokenMint, NFTokenMintFlag,
    Memo, Payment
)
from xrpl.transaction import sign_and_submit
from xrpl.utils import xrp_to_drops
from xrpl.models.requests import Tx
from config import settings
import PIL

client = JsonRpcClient(settings.RPC_URL)

def get_manufacturer_wallet() -> Wallet:
    if not settings.MANUFACTURER_SEED:
        raise ValueError("MANUFACTURER_SEED not set in .env")
    return Wallet.from_seed(settings.MANUFACTURER_SEED)

MANUFACTURER = get_manufacturer_wallet()

def create_recyclable_item(
    product_name: str,
    deposit_xrp: Optional[float] = None,
    recycler_percent: Optional[int] = None,
    years: Optional[int] = None
):
    deposit_xrp = deposit_xrp or settings.DEFAULT_DEPOSIT_XRP
    recycler_percent = recycler_percent or settings.RECYCLER_REWARD_PERCENT
    years = years or settings.ESCROW_YEARS

    # 1. Mint NFT
    print("MINTING NFT")
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

    print(f"starting sign ant submit")
    response = sign_and_submit(mint_tx, wallet=MANUFACTURER, client=client)
    print(f"the response is {response}")

    print(f"starting extracting the nft id")
    nft_id = _extract_nft_id(response.result)
    print(f"the nft_id is {nft_id}")
    
    print("CREATING ESCROW")
    # 2. Create Escrow
    finish_time = int((datetime.now(timezone.utc) + timedelta(days=years * 365)).timestamp())
    escrow_tx = EscrowCreate(
        account=MANUFACTURER.classic_address,
        amount=xrp_to_drops(deposit_xrp),
        destination=MANUFACTURER.classic_address,
        finish_after=finish_time,
        memos=[
            Memo.from_dict({
                "memo_data": nft_id.encode().hex(),
                "memo_type": "LinkedNFT".encode().hex(),
            }),
            Memo.from_dict({
                "memo_data": "RecycleFiDeposit".encode().hex(),
                "memo_type": "text/plain".encode().hex(),
            })
        ]
    )
    escrow_resp = sign_and_submit(escrow_tx, wallet=MANUFACTURER, client=client)
    escrow_seq = escrow_resp.result["tx_json"]["Sequence"]

    print("CREATING QR CODE")
    # 3. QR Code
    recycle_url = f"{settings.RECYCLE_DAPP_URL}?nft={nft_id}&escrow={escrow_seq}"
 
    img = qrcode.make(recycle_url)
    os.makedirs("qrcodes", exist_ok=True)
    qr_path: str = f"qrcodes/{product_name.replace(' ', '_')}_{nft_id[-8:]}.png"
    img.save(qr_path)

    return {
        "product": product_name,
        "nft_id": nft_id,
        "escrow_sequence": escrow_seq,
        "deposit_xrp": deposit_xrp,
        "recycler_gets_%": recycler_percent,
        "expires_in_years": years,
        "qr_code": qr_path,
        "scan_url": recycle_url
    }

def _extract_nft_id(result: dict[str, Any]) -> str:
    meta = result.get("meta", {})
    if isinstance(meta, str):
        import json
        meta = json.loads(meta)

    for node in meta.get("AffectedNodes", []):
        # Check CreatedNode (new NFTokenPage)
        if node.get("CreatedNode", {}).get("LedgerEntryType") == "NFTokenPage":
            nftokens = node["CreatedNode"].get("NewFields", {}).get("NFTokens")
            if nftokens:
                return nftokens[0]["NFToken"]["NFTokenID"]
        
        # Check ModifiedNode (existing NFTokenPage)
        if node.get("ModifiedNode", {}).get("LedgerEntryType") == "NFTokenPage":
            # Compare PreviousFields and FinalFields to find the new NFT
            previous = node["ModifiedNode"].get("PreviousFields", {}).get("NFTokens", [])
            final = node["ModifiedNode"].get("FinalFields", {}).get("NFTokens", [])
            
            # The new NFT should be in final but not in previous
            if len(final) > len(previous):
                # Get the new NFT (usually the last one)
                return final[-1]["NFToken"]["NFTokenID"]
            
            # Alternative: just return the last NFT if we can't compare
            if final:
                return final[-1]["NFToken"]["NFTokenID"]

    # Debug info if nothing found
    import json
    print("DEBUG: Full meta structure:")
    print(json.dumps(meta, indent=2))
    
    raise ValueError("Could not find minted NFTokenID in transaction result")


def create_recyclable_item(
    product_name: str,
    deposit_xrp: Optional[float] = None,
    recycler_percent: Optional[int] = None,
    years: Optional[int] = None
):
    deposit_xrp = deposit_xrp or settings.DEFAULT_DEPOSIT_XRP
    recycler_percent = recycler_percent or settings.RECYCLER_REWARD_PERCENT
    years = years or settings.ESCROW_YEARS

    # 1. Mint NFT
    print("MINTING NFT")
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

    print("Signing and submitting mint transaction")
    response = sign_and_submit(mint_tx, wallet=MANUFACTURER, client=client)
    print(f"Transaction submitted: {response.result.get('tx_json', {}).get('hash')}")

    # Wait for validation and fetch the validated transaction
    tx_hash = response.result['tx_json']['hash']
    print(f"Waiting for transaction validation...")
    
    max_attempts = 10
    for attempt in range(max_attempts):
        time.sleep(2)  # Wait 2 seconds between attempts
        
        try:
            tx_request = Tx(transaction=tx_hash)
            tx_response = client.request(tx_request)
            
            if tx_response.is_successful() and tx_response.result.get('validated'):
                print("Transaction validated!")
                nft_id = _extract_nft_id(tx_response.result)
                print(f"NFT ID extracted: {nft_id}")
                break
        except Exception as e:
            print(f"Attempt {attempt + 1}/{max_attempts}: {e}")
            if attempt == max_attempts - 1:
                raise ValueError(f"Transaction not validated after {max_attempts} attempts")
    else:
        raise ValueError("Failed to get validated transaction")
    
    assert nft_id, "FAILED TO EXTRACT NFT ID"

    print("CREATING ESCROW")
    # 2. Create Escrow
    finish_time = int((datetime.now(timezone.utc) + timedelta(days=years * 365)).timestamp())
    escrow_tx = EscrowCreate(
        account=MANUFACTURER.classic_address,
        amount=xrp_to_drops(deposit_xrp),
        destination=MANUFACTURER.classic_address,
        finish_after=finish_time,
        memos=[
            Memo.from_dict({
                "memo_data": nft_id.encode().hex(),
                "memo_type": "LinkedNFT".encode().hex(),
            }),
            Memo.from_dict({
                "memo_data": "RecycleFiDeposit".encode().hex(),
                "memo_type": "text/plain".encode().hex(),
            })
        ]
    )
    escrow_resp = sign_and_submit(escrow_tx, wallet=MANUFACTURER, client=client)
    escrow_seq = escrow_resp.result["tx_json"]["Sequence"]

    print("CREATING QR CODE")
    # 3. QR Code
    recycle_url = f"{settings.RECYCLE_DAPP_URL}?nft={nft_id}&escrow={escrow_seq}"
    img = qrcode.make(recycle_url)
    os.makedirs("qrcodes", exist_ok=True)
    qr_path: str = f"qrcodes/{product_name.replace(' ', '_')}_{nft_id[-8:]}.png"
    img.save(qr_path)

    return {
        "product": product_name,
        "nft_id": nft_id,
        "escrow_sequence": escrow_seq,
        "deposit_xrp": deposit_xrp,
        "recycler_gets_%": recycler_percent,
        "expires_in_years": years,
        "qr_code": qr_path,
        "scan_url": recycle_url
    }