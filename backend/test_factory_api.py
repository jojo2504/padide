# test_factory.py — SPAM 50 ITEMS IN <15 SECONDS (5 concurrent)
import asyncio
from typing import Any, List
import httpx
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

async def produce_item(client: httpx.AsyncClient, name: str, deposit: float):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Producing: {name} ({deposit} XRP)")
    try:
        response = await client.post(
            f"{BASE_URL}/api/v1/factory/produce",
            data={
                "product_name": name,
                "deposit_xrp": deposit
            },
            timeout=60.0
        )
        if response.status_code == 200:
            result = response.json()
            print(f"COMPLETED: {name} | NFT: {result.get('nft_id', '')[-8:]} | QR ready")
        else:
            print(f"FAILED: {name} | {response.status_code}")
    except Exception as e:
        print(f"ERROR: {name} | {e}")

async def spam_factory():
    print("STARTING MASS PRODUCTION (5 concurrent max)\n" + "="*60)
    
    # Create async HTTP client (reuses connections)
    async with httpx.AsyncClient() as client:
        tasks: List[Any] = []
        for i in range(5):  # Change to 100, 200, 500 — it scales!
            name = f"RecycleFi Bottle #{i+1:03d} {['', 'Premium', 'Eco', 'Pro', 'Ultra'][i%5]}"
            deposit = 0.00001
            
            # This will run max 5 at a time thanks to your semaphore!
            task: Any = asyncio.create_task(produce_item(client, name, deposit))
            tasks.append(task)
            
            # Optional: tiny delay to see progress clearly
            await asyncio.sleep(0.1)
        
        print(f"\nLaunched {len(tasks)} production tasks (max 5 concurrent)\n")
        await asyncio.gather(*tasks)

    print("\n" + "="*60)
    print("MASS PRODUCTION COMPLETE!")
    print(f"Check ./qrcodes — you should have {len(tasks)} new QR codes")

if __name__ == "__main__":
    start = time.time()
    asyncio.run(spam_factory())
    print(f"\nTotal time: {time.time() - start:.1f} seconds")