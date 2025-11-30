"""
CUSD Minting Script
===================
Mint new CUSD tokens from the issuer wallet.

The issuer can create CUSD out of thin air and send it to any wallet
that has a trust line set up to the issuer.

Usage:
    python mint_cusd.py <destination_address> <amount>
    
Example:
    python mint_cusd.py rBbKwL2QEDMPvC8e2zAogfBwLB3pwkcLLJ 1000
"""

import asyncio
import sys
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import Payment, IssuedCurrencyAmount, AccountLines
from xrpl.asyncio.transaction import sign_and_submit

# Configuration - Your CUSD Issuer
RPC_URL = 'https://s.altnet.rippletest.net:51234'
CUSD_ISSUER = 'rpWYyReCdfisZEd99q14gg96NrAEpcauMt'
CUSD_ISSUER_SECRET = 'sEdTArShX3DnABrCWFvpA4NzucPyWpC'
CUSD_HEX = '4355534400000000000000000000000000000000'


async def mint_cusd(destination: str, amount: str):
    """Mint CUSD by sending from issuer to destination"""
    
    client = AsyncJsonRpcClient(RPC_URL)
    issuer = Wallet.from_seed(CUSD_ISSUER_SECRET)
    
    print(f"CUSD Issuer: {issuer.address}")
    print(f"Destination: {destination}")
    print(f"Amount: {amount} CUSD")
    
    # Check if destination has a trust line
    lines = await client.request(AccountLines(account=destination))
    has_trust = any(
        line.get('account') == CUSD_ISSUER 
        for line in lines.result.get('lines', [])
    )
    
    if not has_trust:
        print("\nERROR: Destination doesn't have a trust line to CUSD issuer!")
        print("The destination wallet needs to create a trust line first.")
        return False
    
    # Check current balance
    for line in lines.result.get('lines', []):
        if line.get('account') == CUSD_ISSUER:
            print(f"Current CUSD balance: {line['balance']}")
    
    # Mint CUSD (send from issuer)
    print(f"\nMinting {amount} CUSD...")
    
    payment = Payment(
        account=issuer.address,
        destination=destination,
        amount=IssuedCurrencyAmount(
            currency=CUSD_HEX,
            issuer=issuer.address,  # Issuer is the source
            value=amount
        )
    )
    
    result = await sign_and_submit(payment, client, issuer)
    
    if result.is_successful():
        tx_hash = result.result.get('tx_json', {}).get('hash')
        print(f"SUCCESS! Minted {amount} CUSD")
        print(f"TX: https://testnet.xrpl.org/transactions/{tx_hash}")
        
        # Show new balance
        lines = await client.request(AccountLines(account=destination))
        for line in lines.result.get('lines', []):
            if line.get('account') == CUSD_ISSUER:
                print(f"New CUSD balance: {line['balance']}")
        return True
    else:
        print(f"FAILED: {result.result}")
        return False


async def main():
    if len(sys.argv) < 3:
        print(__doc__)
        
        # Default: mint 1000 CUSD to CYCLR Platform wallet
        print("\nNo args provided. Minting 1000 CUSD to CYCLR Platform...")
        destination = 'rBbKwL2QEDMPvC8e2zAogfBwLB3pwkcLLJ'
        amount = '1000'
    else:
        destination = sys.argv[1]
        amount = sys.argv[2]
    
    await mint_cusd(destination, amount)


if __name__ == '__main__':
    asyncio.run(main())
