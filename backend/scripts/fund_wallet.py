"""
XRP Faucet Funding Bot
======================
Creates temporary wallets and sends their XRP to your target wallet.

On XRPL Testnet, each faucet request gives ~100 XRP.
This bot creates wallets, gets faucet funds, and forwards to your wallet.

Usage:
    python fund_wallet.py <target_address> <num_wallets>
    
Example:
    python fund_wallet.py ra9AoxBQTm3NxzTvuG8a4uQ4ro1be8dwC3 10
    
This will create 10 wallets, get ~100 XRP each, and send ~90 XRP each
(keeping 10 XRP for reserve) to your target = ~900 XRP total!
"""

import asyncio
import aiohttp
import sys
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import Payment, AccountInfo
from xrpl.asyncio.transaction import sign_and_submit
from xrpl.utils import xrp_to_drops, drops_to_xrp

RPC_URL = 'https://s.altnet.rippletest.net:51234'
FAUCET_URL = 'https://faucet.altnet.rippletest.net/accounts'

# Keep this much XRP in temp wallet (for reserves + fees)
RESERVE_XRP = 12


async def fund_from_faucet(address: str) -> dict:
    """Request XRP from testnet faucet"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                FAUCET_URL,
                json={"destination": address},
                headers={"Content-Type": "application/json"}
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    text = await resp.text()
                    return {"error": f"Status {resp.status}: {text}"}
        except Exception as e:
            return {"error": str(e)}


async def get_balance(client: AsyncJsonRpcClient, address: str) -> float:
    """Get XRP balance for an address"""
    try:
        info = await client.request(AccountInfo(account=address))
        return float(drops_to_xrp(info.result['account_data']['Balance']))
    except:
        return 0.0


async def send_xrp(
    client: AsyncJsonRpcClient, 
    wallet: Wallet, 
    destination: str, 
    amount: float
) -> bool:
    """Send XRP from wallet to destination"""
    payment = Payment(
        account=wallet.address,
        destination=destination,
        amount=xrp_to_drops(amount)
    )
    
    result = await sign_and_submit(payment, client, wallet)
    return result.is_successful()


async def fund_target_wallet(target_address: str, num_wallets: int = 5):
    """Create temp wallets, fund them, and send XRP to target"""
    
    client = AsyncJsonRpcClient(RPC_URL)
    
    print("=" * 60)
    print("XRP FAUCET FUNDING BOT")
    print("=" * 60)
    print(f"Target: {target_address}")
    print(f"Creating {num_wallets} temporary wallets...")
    print("=" * 60)
    
    total_sent = 0
    
    for i in range(num_wallets):
        print(f"\n[Wallet {i+1}/{num_wallets}]")
        
        # Create temp wallet
        temp_wallet = Wallet.create()
        print(f"  Created: {temp_wallet.address[:12]}...")
        
        # Fund from faucet
        print(f"  Requesting from faucet...")
        result = await fund_from_faucet(temp_wallet.address)
        
        if "error" in result:
            print(f"  Faucet error: {result['error']}")
            continue
        
        # Wait for account activation
        await asyncio.sleep(3)
        
        # Check balance
        balance = await get_balance(client, temp_wallet.address)
        print(f"  Balance: {balance:.2f} XRP")
        
        if balance <= RESERVE_XRP:
            print(f"  Not enough to send (need > {RESERVE_XRP} XRP)")
            continue
        
        # Calculate amount to send (keep reserve)
        send_amount = balance - RESERVE_XRP
        
        # Send to target
        print(f"  Sending {send_amount:.2f} XRP to target...")
        success = await send_xrp(client, temp_wallet, target_address, send_amount)
        
        if success:
            print(f"  Sent!")
            total_sent += send_amount
        else:
            print(f"  Failed to send")
        
        # Small delay to avoid rate limiting
        await asyncio.sleep(1)
    
    # Final balance check
    await asyncio.sleep(2)
    target_balance = await get_balance(client, target_address)
    
    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
    print(f"Total XRP sent: {total_sent:.2f}")
    print(f"Target balance: {target_balance:.2f} XRP")


async def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nQuick test - funding default wallet with 3 temp wallets:")
        target = "ra9AoxBQTm3NxzTvuG8a4uQ4ro1be8dwC3"
        num = 3
    else:
        target = sys.argv[1]
        num = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    await fund_target_wallet(target, num)


if __name__ == '__main__':
    asyncio.run(main())
