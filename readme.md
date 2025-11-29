# CYCLR ECOSYSTEM SETUP

## STEP 1: Creating Wallets

## [CUSD ISSUER] Creating wallet...
- Address: ***rpWYyReCdfisZEd99q14gg96NrAEpcauMt***
- Seed:    ***sEdTArShX3DnABrCWFvpA4NzucPyWpC***
- Funding from faucet...
- Funded rpWYyReC... with 100
- Balance: 100.0 XRP

## [POOL CREATOR] Creating wallet...
- Address: ***rLLVTDLWfomZ9gm8BbmuYryG3nTHtwPZvu***
- Seed:    ***sEd7yKPTYUREpUNdNA2q8a8f5HmFjea***
- Funding from faucet...
- Funded rLLVTDLW... with 100
- Balance: 100.0 XRP

## [CYCLR PLATFORM] Creating wallet...
- Address: ***rBbKwL2QEDMPvC8e2zAogfBwLB3pwkcLLJ***
- Seed:    ***sEdT18iUpWKctx6w7V1UPCN22ZK46bd***
- Funding from faucet...
- Funded rBbKwL2Q... with 100
- Balance: 100.0 XRP

## [POOL CREATOR] Funding extra XRP for pool...
- Funded rLLVTDLW... with 100
- Funded rLLVTDLW... with 100
- Funded rLLVTDLW... with 100
- Funded rLLVTDLW... with 100
- Funded rLLVTDLW... with 100

## STEP 2: Configure CUSD Issuer

```
[ISSUER] Setting up issuer flags...
DefaultRipple enabled
```

## STEP 3: Create Trust Lines

```
Creating trust line for rLLVTDLW...
Trust line created
Creating trust line for rBbKwL2Q...
Trust line created
```
## STEP 4: Distribute CUSD
  Sending 2000 CUSD to rLLVTDLW...
  Sent 2000 CUSD
  Sending 500 CUSD to rBbKwL2Q...
  Sent 500 CUSD

## STEP 5: Create AMM Pool

***[AMM] Creating XRP/CUSD pool...***
- XRP:  500
- CUSD: 1000
- AMM Created!
- TX: https://testnet.xrpl.org/transactions/02C1186DFFEB96103439BE080D0C0114C8AB48B11C12A60B7E4A1A1E1FD3F321

## STEP 6: Verification

AMM Pool Created Successfully!
- AMM Account: ***rN66ywBQKiGV2X2kYsuQsB2uJyG5cJLiKT***
- XRP in pool: 500.0
- CUSD in pool: 1000.0
- LP Tokens: 707106.7811865475

-----------

--- Copy this to your .env file ---

# CUSD Token Issuer
CUSD_ISSUER=rpWYyReCdfisZEd99q14gg96NrAEpcauMt
CUSD_ISSUER_SECRET=sEdTArShX3DnABrCWFvpA4NzucPyWpC

# Pool Creator (holds LP tokens)
POOL_CREATOR=rLLVTDLWfomZ9gm8BbmuYryG3nTHtwPZvu
POOL_CREATOR_SECRET=sEd7yKPTYUREpUNdNA2q8a8f5HmFjea

# CYCLR Platform Wallet
CYCLR_WALLET=rBbKwL2QEDMPvC8e2zAogfBwLB3pwkcLLJ
CYCLR_WALLET_SECRET=sEdT18iUpWKctx6w7V1UPCN22ZK46bd

# AMM Pool Account
AMM_ACCOUNT=rN66ywBQKiGV2X2kYsuQsB2uJyG5cJLiKT

Config saved to: C:\Users\olo\Programmes\CYCLR\backend\ecosystem_config.json

Summary:
--------
- CUSD Issuer created and configured
- Pool Creator funded with XRP + CUSD
- CYCLR Platform wallet ready
- AMM Pool (XRP/CUSD) is live!

Price: 1 CUSD = 0.5 XRP

You can now:
1. Update your .env with the new wallet addresses
2. Start the backend server
3. Users can swap XRP <-> CUSD through the AMM