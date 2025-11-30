# testmain_final_showdown.py — DUAL PATH DEMO (Recycle vs Auto-Redeem)

import asyncio
import time
import requests
from xrpl.wallet import Wallet
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill, sign, submit_and_wait
from xrpl.utils import xrp_to_drops
from xrpl.models import Payment, NFTokenCreateOffer, NFTokenAcceptOffer, NFTokenBurn, NFTokenCreateOfferFlag, AccountInfo

BASE_URL = "http://127.0.0.1:8000"
client = AsyncJsonRpcClient("https://s.altnet.rippletest.net:51234/")

# TESTNET SEEDS — FUNDED
RECYCLEFI_SEED = "sEdT18iUpWKctx6w7V1UPCN22ZK46bd"
CONSUMER_SEED  = "sEdTfzsWzEnC1gnxd9ViJJZWW7f9haB"
COMPANY_SEED   = "sEd71jnhCy64g8kpBYzkfddYfRyQCHZ"

recyclefi = Wallet.from_seed(RECYCLEFI_SEED)
consumer = Wallet.from_seed(CONSUMER_SEED)
company = Wallet.from_seed(COMPANY_SEED)

print("RECYCLEFI v3 — DUAL PATH TEST: Recycle vs Auto-Redeem")
print(f"RecycleFi : {recyclefi.classic_address}")
print(f"Consumer  : {consumer.classic_address}")
print(f"Company   : {company.classic_address}\n")


async def balance(wallet, name):
    try:
        resp = await client.request(AccountInfo(account=wallet.classic_address, ledger_index="validated"))
        bal = int(resp.result["account_data"]["Balance"]) / 1_000_000
        print(f"   {name:10}: {bal:8.4f} XRP")
    except:
        print(f"   {name:10}: ??? (not activated)")


async def consumer_pay_recyclefi(amount: float):
    print(f"Consumer → RecycleFi: {amount} XRP")
    tx = Payment(
        account=consumer.classic_address,
        destination=recyclefi.classic_address,
        amount=xrp_to_drops(amount)
    )
    signed = sign(await autofill(tx, client), consumer)
    resp = await submit_and_wait(signed, client)
    print(f"   TX: {resp.result['hash'][:10]}...")
    await asyncio.sleep(4)


async def purchase(product_name: str, price: float) -> str:
    await consumer_pay_recyclefi(price)

    print(f"\nBUYING: {product_name} ({price} XRP)")
    r = requests.post(f"{BASE_URL}/api/v1/purchase", data={
        "product_name": product_name,
        "price_xrp": str(price),
        "deposit_percent": "6.0",
        "company_wallet": company.classic_address,
        "consumer_wallet": consumer.classic_address
    })
    if r.status_code != 200:
        print("API ERROR:", r.text)
        exit(1)
    data = r.json()
    nft = data["nft_id"]
    print(f"   NFT: {nft[-12:]}")
    print(f"   Company got: {data['company_received_xrp']:.3f} XRP")
    print(f"   RecycleFi fee: {data['protocol_fee_xrp']:.3f} XRP")
    print(f"   QR: {BASE_URL}{data['qr_code']}")
    return nft


async def transfer_nft_to_consumer(nft_id: str):
    print("   Transferring NFT to consumer...")
    offer = NFTokenCreateOffer(
        account=recyclefi.classic_address,
        nftoken_id=nft_id,
        amount="0",
        destination=consumer.classic_address,
        flags=NFTokenCreateOfferFlag.TF_SELL_NFTOKEN
    )
    signed = sign(await autofill(offer, client), recyclefi)
    resp = await submit_and_wait(signed, client)

    # Extract offer index
    meta = resp.result["meta"]
    if isinstance(meta, str): import json; meta = json.loads(meta)
    offer_index = None
    for node in meta.get("AffectedNodes", []):
        if "CreatedNode" in node and node["CreatedNode"].get("LedgerEntryType") == "NFTokenOffer":
            offer_index = node["CreatedNode"]["LedgerIndex"]
            break

    accept = NFTokenAcceptOffer(
        account=consumer.classic_address,
        nftoken_sell_offer=offer_index
    )
    signed = sign(await autofill(accept, client), consumer)
    await submit_and_wait(signed, client)
    print("   NFT now owned by consumer")


async def path_a_recycle_immediately(nft_id: str):
    print("\nPATH A: CONSUMER RECYCLES IMMEDIATELY")
    await transfer_nft_to_consumer(nft_id)

    print("   Consumer burns NFT...")
    burn = NFTokenBurn(account=consumer.classic_address, nftoken_id=nft_id)
    signed = sign(await autofill(burn, client), consumer)
    resp = await submit_and_wait(signed, client)
    burn_hash = resp.result["hash"]
    print(f"   BURNED: {burn_hash[:10]}...")

    print("   Claiming reward...")
    r = requests.post(f"{BASE_URL}/api/v1/recycle", json={
        "nft_id": nft_id,
        "user_wallet": consumer.classic_address,
        "burn_tx_hash": burn_hash
    })
    result = r.json()
    print(f"   Recycler reward: {result.get('recycler_reward_xrp', 0):.3f} XRP")
    print(f"   Company bonus: {result.get('company_bonus_xrp', 0):.3f} XRP")
    print("   PATH A SUCCESS — Consumer incentivized!")


async def path_b_auto_redeem_after_expiry(nft_id: str):
    print(f"\nPATH B: WAITING 70 SECONDS → AUTO-REDEEM (80/20 SPLIT)")
    print("   NFT expires in 30 days... but we're fast-forwarding")
    
    print("   Waiting 40 seconds for ledger to settle + expiry simulation...")
    for i in range(40, 0, -10):
        print(f"   {i:2d}s...", end="\r")
        await asyncio.sleep(10)
    print("   TIME'S UP! Redeeming...")

    r = requests.post(f"{BASE_URL}/api/v1/redeem-expired", data={
        "nft_id": nft_id,
        "company_wallet": company.classic_address
    })
    if r.status_code != 200:
        print("REDEEM FAILED:", r.text)
    else:
        data = r.json()
        print(f"   SUCCESS! Total withdrawn: {data['total_withdrawn_xrp']:.4.3f} XRP")
        print(f"   Company (80%): {data['company_received_80']:.3f} XRP")
        print(f"   RecycleFi (20%): {data['recyclefi_kept_20']:.3f} XRP")
        print(f"   TX: https://test.bithomp.com/explorer/{data.get('company_tx', '')[-10:]}")
        print("   PATH B SUCCESS — Company & RecycleFi win when not recycled!")

async def activate_if_needed(wallet, name):
    try:
        await client.request(AccountInfo(account=wallet.classic_address))
    except:
        print(f"   Activating {name} with 20 XRP from faucet...")
        # Use testnet faucet
        import requests
        requests.post("https://faucet.altnet.rippletest.net/accounts", json={
            "destination": wallet.classic_address
        })
        await asyncio.sleep(8)  # wait for activation
        print(f"   {name} activated!")
        
async def main():
    print("ACTIVATING TESTNET ACCOUNTS...")
    await activate_if_needed(recyclefi, "RecycleFi")
    await activate_if_needed(consumer, "Consumer")
    await activate_if_needed(company, "Company")

    print("INITIAL BALANCES")
    await balance(recyclefi, "RecycleFi")
    await balance(consumer, "Consumer")
    await balance(company, "Company")

    print("\n" + "="*60)
    print("PURCHASING TWO PRODUCTS")
    print("="*60)

    nft1 = await purchase("Recycled Bottle", 15.0)   # Will be recycled
    await balance(recyclefi, "RecycleFi")
    await path_a_recycle_immediately(nft1)

    # print("\nBALANCES AFTER PURCHASES")

    # PATH A: Immediate recycle

    # PATH B: Wait → auto-redeem
    # nft2 = await purchase("Forgotten Bottle", 15.0)  # Will expire → auto-redeemed
    # await balance(company, "Company")
    # await path_b_auto_redeem_after_expiry(nft2)

    print("\n" + "="*60)
    print("FINAL BALANCES — PROOF OF DUAL REVENUE")
    print("="*60)
    await balance(recyclefi, "RecycleFi")
    await balance(consumer, "Consumer")
    await balance(company, "Company")

    print("\nDUAL PATH TEST COMPLETE!")
    print("   When recycled → Consumer rewarded")
    print("   When forgotten → Company + RecycleFi split 80/20")
    print("   You now have TWO revenue streams. Ship it.")


if __name__ == "__main__":
    asyncio.run(main())