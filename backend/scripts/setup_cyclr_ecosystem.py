"""
CYCLR Ecosystem Setup Script
============================
This script creates the complete CYCLR token ecosystem:

1. Creates 3 wallets:
   - CUSD Issuer (creates and mints CUSD tokens)
   - Pool Creator (creates the AMM pool)
   - CYCLR Platform (your main operational wallet)

2. Funds wallets with XRP from testnet faucet

3. Creates CUSD token and distributes it

4. Creates XRP/CUSD AMM pool

Run this once to set up everything!
"""

import asyncio
import aiohttp
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import (
    Payment, TrustSet, AccountSet, AccountSetAsfFlag,
    AMMCreate, IssuedCurrencyAmount, IssuedCurrency,
    AccountInfo, AccountLines, AMMInfo
)
from xrpl.asyncio.transaction import sign_and_submit
from xrpl.utils import xrp_to_drops, drops_to_xrp
import json
from pathlib import Path

# Configuration
RPC_URL = 'https://s.altnet.rippletest.net:51234'
FAUCET_URL = 'https://faucet.altnet.rippletest.net/accounts'

# CUSD = CYCLR USD (our stablecoin)
CUSD_CODE = 'CUSD'
CUSD_HEX = '4355534400000000000000000000000000000000'  # CUSD in hex

# How much to put in the initial pool
INITIAL_XRP_IN_POOL = 500   # 500 XRP
INITIAL_CUSD_IN_POOL = 1000  # 1000 CUSD (so 1 CUSD = 0.5 XRP initially)


async def fund_wallet_from_faucet(address: str) -> bool:
    """Request XRP from the testnet faucet"""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                FAUCET_URL,
                json={"destination": address},
                headers={"Content-Type": "application/json"}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"  Funded {address[:8]}... with {data.get('amount', 'XRP')}")
                    return True
                else:
                    print(f"  Faucet error: {resp.status}")
                    return False
        except Exception as e:
            print(f"  Faucet error: {e}")
            return False


async def create_funded_wallet(client: AsyncJsonRpcClient, name: str) -> Wallet:
    """Create a new wallet and fund it from faucet"""
    print(f"\n[{name}] Creating wallet...")
    wallet = Wallet.create()
    print(f"  Address: {wallet.address}")
    print(f"  Seed:    {wallet.seed}")
    
    print(f"  Funding from faucet...")
    await fund_wallet_from_faucet(wallet.address)
    
    # Wait for funding to complete
    await asyncio.sleep(2)
    
    # Verify balance
    try:
        info = await client.request(AccountInfo(account=wallet.address))
        balance = float(drops_to_xrp(info.result['account_data']['Balance']))
        print(f"  Balance: {balance} XRP")
    except:
        print(f"  Waiting for account activation...")
        await asyncio.sleep(3)
    
    return wallet


async def setup_issuer(client: AsyncJsonRpcClient, issuer: Wallet) -> bool:
    """Configure the issuer wallet with DefaultRipple flag"""
    print(f"\n[ISSUER] Setting up issuer flags...")
    
    # Enable DefaultRipple (required for issued currencies)
    account_set = AccountSet(
        account=issuer.address,
        set_flag=AccountSetAsfFlag.ASF_DEFAULT_RIPPLE
    )
    
    result = await sign_and_submit(account_set, client, issuer)
    
    if result.is_successful():
        print(f"  DefaultRipple enabled")
        return True
    else:
        print(f"  Failed: {result.result}")
        return False


async def create_trust_line(
    client: AsyncJsonRpcClient, 
    wallet: Wallet, 
    issuer_address: str,
    limit: str = "1000000000"
) -> bool:
    """Create a trust line from wallet to CUSD issuer"""
    print(f"  Creating trust line for {wallet.address[:8]}...")
    
    trust = TrustSet(
        account=wallet.address,
        limit_amount=IssuedCurrencyAmount(
            currency=CUSD_HEX,
            issuer=issuer_address,
            value=limit
        )
    )
    
    result = await sign_and_submit(trust, client, wallet)
    
    if result.is_successful():
        print(f"  Trust line created")
        return True
    else:
        print(f"  Failed: {result.result}")
        return False


async def send_cusd(
    client: AsyncJsonRpcClient,
    issuer: Wallet,
    destination: str,
    amount: str
) -> bool:
    """Send CUSD from issuer to destination"""
    print(f"  Sending {amount} CUSD to {destination[:8]}...")
    
    payment = Payment(
        account=issuer.address,
        destination=destination,
        amount=IssuedCurrencyAmount(
            currency=CUSD_HEX,
            issuer=issuer.address,
            value=amount
        )
    )
    
    result = await sign_and_submit(payment, client, issuer)
    
    if result.is_successful():
        print(f"  Sent {amount} CUSD")
        return True
    else:
        print(f"  Failed: {result.result}")
        return False


async def create_amm_pool(
    client: AsyncJsonRpcClient,
    creator: Wallet,
    issuer_address: str,
    xrp_amount: int,
    cusd_amount: int
) -> bool:
    """Create the XRP/CUSD AMM pool"""
    print(f"\n[AMM] Creating XRP/CUSD pool...")
    print(f"  XRP:  {xrp_amount}")
    print(f"  CUSD: {cusd_amount}")
    
    amm_create = AMMCreate(
        account=creator.address,
        amount=xrp_to_drops(xrp_amount),  # XRP in drops
        amount2=IssuedCurrencyAmount(
            currency=CUSD_HEX,
            issuer=issuer_address,
            value=str(cusd_amount)
        ),
        trading_fee=100  # 0.1% fee (100 = 0.1%)
    )
    
    result = await sign_and_submit(amm_create, client, creator)
    
    if result.is_successful():
        tx_hash = result.result.get('tx_json', {}).get('hash')
        print(f"  AMM Created!")
        print(f"  TX: https://testnet.xrpl.org/transactions/{tx_hash}")
        return True
    else:
        print(f"  Failed: {result.result}")
        return False


async def get_amm_info(client: AsyncJsonRpcClient, issuer_address: str):
    """Get AMM pool info"""
    try:
        result = await client.request(AMMInfo(
            asset={'currency': 'XRP'},
            asset2=IssuedCurrency(currency=CUSD_HEX, issuer=issuer_address)
        ))
        amm = result.result.get('amm', {})
        return {
            'account': amm.get('account'),
            'xrp': float(drops_to_xrp(amm.get('amount', '0'))),
            'cusd': float(amm.get('amount2', {}).get('value', '0')),
            'lp_tokens': amm.get('lp_token', {}).get('value', '0')
        }
    except Exception as e:
        return None


async def main():
    print("=" * 60)
    print("CYCLR ECOSYSTEM SETUP")
    print("=" * 60)
    
    client = AsyncJsonRpcClient(RPC_URL)
    
    # Step 1: Create wallets
    print("\n" + "=" * 60)
    print("STEP 1: Creating Wallets")
    print("=" * 60)
    
    issuer = await create_funded_wallet(client, "CUSD ISSUER")
    await asyncio.sleep(1)
    
    pool_creator = await create_funded_wallet(client, "POOL CREATOR")
    await asyncio.sleep(1)
    
    cyclr = await create_funded_wallet(client, "CYCLR PLATFORM")
    await asyncio.sleep(1)
    
    # Fund pool creator extra (need lots of XRP for pool)
    print("\n[POOL CREATOR] Funding extra XRP for pool...")
    for i in range(5):  # Get 5 more faucet drops
        await fund_wallet_from_faucet(pool_creator.address)
        await asyncio.sleep(1)
    
    await asyncio.sleep(3)
    
    # Step 2: Setup issuer
    print("\n" + "=" * 60)
    print("STEP 2: Configure CUSD Issuer")
    print("=" * 60)
    
    await setup_issuer(client, issuer)
    
    # Step 3: Create trust lines
    print("\n" + "=" * 60)
    print("STEP 3: Create Trust Lines")
    print("=" * 60)
    
    await create_trust_line(client, pool_creator, issuer.address)
    await create_trust_line(client, cyclr, issuer.address)
    
    # Step 4: Send CUSD
    print("\n" + "=" * 60)
    print("STEP 4: Distribute CUSD")
    print("=" * 60)
    
    await send_cusd(client, issuer, pool_creator.address, str(INITIAL_CUSD_IN_POOL + 1000))
    await send_cusd(client, issuer, cyclr.address, "500")  # Some CUSD for CYCLR operations
    
    await asyncio.sleep(2)
    
    # Step 5: Create AMM Pool
    print("\n" + "=" * 60)
    print("STEP 5: Create AMM Pool")
    print("=" * 60)
    
    await create_amm_pool(
        client, pool_creator, issuer.address,
        INITIAL_XRP_IN_POOL, INITIAL_CUSD_IN_POOL
    )
    
    await asyncio.sleep(2)
    
    # Step 6: Verify and show results
    print("\n" + "=" * 60)
    print("STEP 6: Verification")
    print("=" * 60)
    
    amm_info = await get_amm_info(client, issuer.address)
    if amm_info:
        print(f"\nAMM Pool Created Successfully!")
        print(f"  AMM Account: {amm_info['account']}")
        print(f"  XRP in pool: {amm_info['xrp']}")
        print(f"  CUSD in pool: {amm_info['cusd']}")
        print(f"  LP Tokens: {amm_info['lp_tokens']}")
    
    # Save configuration
    print("\n" + "=" * 60)
    print("CONFIGURATION TO SAVE")
    print("=" * 60)
    
    config = {
        'CUSD_ISSUER': issuer.address,
        'CUSD_ISSUER_SECRET': issuer.seed,
        'POOL_CREATOR': pool_creator.address,
        'POOL_CREATOR_SECRET': pool_creator.seed,
        'CYCLR_WALLET': cyclr.address,
        'CYCLR_WALLET_SECRET': cyclr.seed,
        'AMM_ACCOUNT': amm_info['account'] if amm_info else 'Unknown',
        'CUSD_HEX': CUSD_HEX
    }
    
    print("\n--- Copy this to your .env file ---\n")
    print(f"# CUSD Token Issuer")
    print(f"CUSD_ISSUER={issuer.address}")
    print(f"CUSD_ISSUER_SECRET={issuer.seed}")
    print(f"")
    print(f"# Pool Creator (holds LP tokens)")
    print(f"POOL_CREATOR={pool_creator.address}")
    print(f"POOL_CREATOR_SECRET={pool_creator.seed}")
    print(f"")
    print(f"# CYCLR Platform Wallet")
    print(f"CYCLR_WALLET={cyclr.address}")
    print(f"CYCLR_WALLET_SECRET={cyclr.seed}")
    print(f"")
    print(f"# AMM Pool Account")
    print(f"AMM_ACCOUNT={amm_info['account'] if amm_info else 'Unknown'}")
    
    # Save to file
    config_file = Path(__file__).parent.parent / 'ecosystem_config.json'
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"\nConfig saved to: {config_file}")
    
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print(f"""
Summary:
--------
- CUSD Issuer created and configured
- Pool Creator funded with XRP + CUSD  
- CYCLR Platform wallet ready
- AMM Pool (XRP/CUSD) is live!

Price: 1 CUSD = {INITIAL_XRP_IN_POOL/INITIAL_CUSD_IN_POOL} XRP

You can now:
1. Update your .env with the new wallet addresses
2. Start the backend server
3. Users can swap XRP <-> CUSD through the AMM
    """)


if __name__ == '__main__':
    asyncio.run(main())
