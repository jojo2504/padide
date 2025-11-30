"""
Script to deposit RUSD to the XRP/RUSD AMM pool

Usage:
    python deposit_to_amm.py <wallet_seed> <rusd_amount>

Example:
    python deposit_to_amm.py sEdV19BLxxxxxxx 1.0
"""
import asyncio
import sys
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import (
    AMMDeposit, AMMInfo, 
    IssuedCurrencyAmount, IssuedCurrency,
    AMMDepositFlag,
    AccountLines
)
from xrpl.asyncio.transaction import sign_and_submit
from xrpl.utils import drops_to_xrp

# Configuration
RPC_URL = 'https://s.altnet.rippletest.net:51234'
RUSD_HEX = '5255534400000000000000000000000000000000'
RUSD_ISSUER = 'rPYFD8rpMZh43vQ3UhHYk14JBz8V9YBdds'


async def get_amm_info(client):
    """Get current AMM pool state"""
    result = await client.request(AMMInfo(
        asset={'currency': 'XRP'},
        asset2=IssuedCurrency(currency=RUSD_HEX, issuer=RUSD_ISSUER)
    ))
    amm = result.result.get('amm', {})
    xrp_pool = float(drops_to_xrp(amm.get('amount', '0')))
    rusd_pool = float(amm.get('amount2', {}).get('value', '0'))
    return xrp_pool, rusd_pool, amm


async def get_rusd_balance(client, address):
    """Get RUSD balance for an address"""
    lines = await client.request(AccountLines(account=address))
    for line in lines.result.get('lines', []):
        if line['currency'] == RUSD_HEX and line['account'] == RUSD_ISSUER:
            return float(line['balance'])
    return 0.0


async def deposit_rusd(wallet_seed: str, amount: float):
    """Deposit RUSD to the AMM pool (single-sided)"""
    client = AsyncJsonRpcClient(RPC_URL)
    
    # Load wallet
    try:
        wallet = Wallet.from_seed(wallet_seed)
    except Exception as e:
        print(f"❌ Invalid wallet seed: {e}")
        return
    
    print(f"📊 Wallet: {wallet.address}")
    
    # Check RUSD balance
    rusd_balance = await get_rusd_balance(client, wallet.address)
    print(f"💰 Your RUSD balance: {rusd_balance}")
    
    if rusd_balance < amount:
        print(f"❌ Insufficient RUSD! You have {rusd_balance}, need {amount}")
        return
    
    # Get current AMM state
    xrp_pool, rusd_pool, amm = await get_amm_info(client)
    print(f"\n📈 Current AMM Pool:")
    print(f"   XRP:  {xrp_pool:,.2f}")
    print(f"   RUSD: {rusd_pool:,.2f}")
    print(f"   Ratio: 1 RUSD = {xrp_pool/rusd_pool:.4f} XRP")
    
    # Build deposit transaction
    deposit = AMMDeposit(
        account=wallet.address,
        asset={'currency': 'XRP'},
        asset2={'currency': RUSD_HEX, 'issuer': RUSD_ISSUER},
        amount2=IssuedCurrencyAmount(
            currency=RUSD_HEX,
            issuer=RUSD_ISSUER,
            value=str(amount)
        ),
        flags=AMMDepositFlag.TF_SINGLE_ASSET
    )
    
    print(f"\n🔄 Depositing {amount} RUSD to AMM...")
    
    result = await sign_and_submit(deposit, client, wallet)
    
    if result.is_successful():
        tx_hash = result.result.get('tx_json', {}).get('hash')
        print(f"✅ SUCCESS!")
        print(f"   TX Hash: {tx_hash}")
        print(f"   Explorer: https://testnet.xrpl.org/transactions/{tx_hash}")
        
        # Show new pool state
        xrp_pool_new, rusd_pool_new, _ = await get_amm_info(client)
        print(f"\n📈 New AMM Pool:")
        print(f"   XRP:  {xrp_pool_new:,.2f}")
        print(f"   RUSD: {rusd_pool_new:,.2f}")
    else:
        print(f"❌ FAILED!")
        print(result.result)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        print("\nTo get your wallet seed:")
        print("1. If using Xaman/Xumm: Export your seed from settings")
        print("2. If using testnet faucet: You received a seed when creating the wallet")
        sys.exit(1)
    
    wallet_seed = sys.argv[1]
    amount = float(sys.argv[2])
    
    asyncio.run(deposit_rusd(wallet_seed, amount))
