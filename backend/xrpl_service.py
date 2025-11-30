# xrpl_service.py
"""
XRPL Service - Handles all blockchain interactions for CYCLR
Including AMM operations for APY generation
Uses CUSD (CYCLR's stablecoin) for product deposits
"""
import asyncio
import os
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from decimal import Decimal

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.wallet import Wallet
from xrpl.models import (
    Payment, Memo,
    AMMDeposit, AMMWithdraw, AMMInfo,
    IssuedCurrencyAmount, IssuedCurrency,
    AccountInfo, AccountLines,
    NFTokenMint, NFTokenMintFlag,
)
from xrpl.asyncio.transaction import sign_and_submit
from xrpl.utils import xrp_to_drops, drops_to_xrp

from config import settings


def currency_to_hex(currency: str) -> str:
    """
    Convert currency code to XRPL hex format.
    3-character codes stay as-is, 4+ characters need hex encoding.
    """
    if len(currency) == 3:
        return currency
    # Pad to 20 bytes (40 hex chars) for non-standard currency codes
    hex_code = currency.encode('utf-8').hex().upper()
    return hex_code.ljust(40, '0')


class XRPLService:
    """Service for all XRPL operations"""
    
    def __init__(self):
        self.client = AsyncJsonRpcClient(settings.RPC_URL)
        
        # CUSD currency (primary)
        self.cusd_currency_code = currency_to_hex(settings.CUSD_CURRENCY)
        self.cusd_issuer = settings.CUSD_ISSUER
        self.cusd_currency = {
            "currency": self.cusd_currency_code,
            "issuer": self.cusd_issuer
        }
        
        # Backward compatibility aliases (RUSD -> CUSD)
        self.rusd_currency_code = self.cusd_currency_code
        self.rusd_currency = self.cusd_currency
        
        # Initialize wallets
        if settings.CYCLR_WALLET_SECRET:
            self.cyclr_wallet = Wallet.from_seed(settings.CYCLR_WALLET_SECRET)
        else:
            self.cyclr_wallet = None
            
        if hasattr(settings, 'CUSD_ISSUER_SECRET') and settings.CUSD_ISSUER_SECRET:
            self.issuer_wallet = Wallet.from_seed(settings.CUSD_ISSUER_SECRET)
        elif hasattr(settings, 'RUSD_ISSUER_SECRET') and settings.RUSD_ISSUER_SECRET:
            self.issuer_wallet = Wallet.from_seed(settings.RUSD_ISSUER_SECRET)
        else:
            self.issuer_wallet = None
    
    # ========================================
    # ACCOUNT OPERATIONS
    # ========================================
    
    async def get_account_balance(self, address: str) -> Dict[str, Any]:
        """Get XRP and CUSD balance for an account"""
        try:
            # Get XRP balance
            account_info = await self.client.request(AccountInfo(account=address))
            xrp_balance = float(drops_to_xrp(account_info.result["account_data"]["Balance"]))
            
            # Get CUSD balance (trust lines)
            cusd_balance = 0.0
            try:
                account_lines = await self.client.request(AccountLines(account=address))
                for line in account_lines.result.get("lines", []):
                    # Check both raw currency code and hex version
                    if ((line["currency"] == settings.CUSD_CURRENCY or 
                         line["currency"] == self.cusd_currency_code) and 
                        line["account"] == self.cusd_issuer):
                        cusd_balance = float(line["balance"])
                        break
            except:
                pass
            
            return {
                "address": address,
                "xrp_balance": xrp_balance,
                "cusd_balance": cusd_balance,
                # Backward compatibility
                "rusd_balance": cusd_balance
            }
        except Exception as e:
            return {"error": str(e)}
    
    # ========================================
    # CUSD TOKEN OPERATIONS
    # ========================================
    
    async def send_cusd(
        self, 
        from_wallet: Wallet, 
        to_address: str, 
        amount: float,
        memo: str = ""
    ) -> Dict[str, Any]:
        """Send CUSD tokens to an address"""
        
        payment = Payment(
            account=from_wallet.classic_address,
            destination=to_address,
            amount=IssuedCurrencyAmount(
                currency=self.cusd_currency_code,
                issuer=self.cusd_issuer,
                value=str(amount)
            ),
            memos=[Memo.from_dict({
                "memo_data": memo.encode().hex(),
                "memo_type": "CYCLR".encode().hex(),
            })] if memo else []
        )
        
        response = await sign_and_submit(payment, wallet=from_wallet, client=self.client)
        
        return {
            "success": response.is_successful(),
            "tx_hash": response.result.get("tx_json", {}).get("hash"),
            "amount": amount,
            "currency": "CUSD"
        }
    
    # Backward compatibility alias
    async def send_rusd(self, *args, **kwargs):
        return await self.send_cusd(*args, **kwargs)
    
    # ========================================
    # AMM OPERATIONS - APY GENERATION
    # ========================================
    
    async def get_amm_info(self) -> Dict[str, Any]:
        """Get current AMM pool info (XRP/CUSD)"""
        try:
            amm_info = await self.client.request(AMMInfo(
                asset={"currency": "XRP"},
                asset2=IssuedCurrency(
                    currency=self.cusd_currency_code,
                    issuer=self.cusd_issuer
                )
            ))
            
            amm = amm_info.result.get("amm", {})
            
            return {
                "success": True,
                "amm_account": amm.get("account"),
                "xrp_pool": float(drops_to_xrp(amm.get("amount", "0"))),
                "cusd_pool": float(amm.get("amount2", {}).get("value", "0")),
                # Backward compatibility
                "rusd_pool": float(amm.get("amount2", {}).get("value", "0")),
                "lp_token": amm.get("lp_token", {}),
                "trading_fee": amm.get("trading_fee", 0) / 1000,  # Convert to percentage
                "vote_slots": amm.get("vote_slots", [])
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def deposit_to_amm(
        self, 
        cusd_amount: float = None,
        product_id: str = "",
        deposit_type: str = "manufacturer",  # "manufacturer" or "customer"
        # Backward compatibility
        rusd_amount: float = None
    ) -> Dict[str, Any]:
        """
        Deposit CUSD into AMM pool to generate APY.
        
        deposit_type:
        - "manufacturer": Called when product is registered (5% manufacturer deposit)
        - "customer": Called when product is sold (5% customer escrow)
        
        The deposit earns trading fees from the AMM.
        """
        # Backward compatibility
        amount = cusd_amount or rusd_amount
        if not amount:
            return {"success": False, "error": "No amount specified"}
            
        if not self.cyclr_wallet:
            return {"success": False, "error": "CYCLR wallet not configured"}
        
        try:
            # Single-sided deposit of CUSD
            deposit = AMMDeposit(
                account=self.cyclr_wallet.classic_address,
                asset={"currency": "XRP"},
                asset2=IssuedCurrency(
                    currency=self.cusd_currency_code,
                    issuer=self.cusd_issuer
                ),
                amount2=IssuedCurrencyAmount(
                    currency=self.cusd_currency_code,
                    issuer=self.cusd_issuer,
                    value=str(amount)
                ),
                flags=0x00080000  # tfSingleAsset flag
            )
            
            response = await sign_and_submit(deposit, wallet=self.cyclr_wallet, client=self.client)
            
            if response.is_successful():
                # Extract LP tokens received
                lp_tokens = self._extract_lp_tokens(response.result)
                
                print(f"✅ AMM Deposit ({deposit_type}): {amount} CUSD → {lp_tokens} LP tokens")
                
                return {
                    "success": True,
                    "tx_hash": response.result.get("tx_json", {}).get("hash"),
                    "cusd_deposited": amount,
                    # Backward compatibility
                    "rusd_deposited": amount,
                    "lp_tokens_received": lp_tokens,
                    "deposit_type": deposit_type,
                    "product_id": product_id
                }
            else:
                return {
                    "success": False,
                    "error": response.result.get("engine_result_message", "Unknown error")
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def withdraw_from_amm(
        self,
        lp_tokens: float,
        product_id: str
    ) -> Dict[str, Any]:
        """
        Withdraw CUSD from AMM pool with earned APY.
        Called when a product is recycled or expires.
        
        Returns the original deposit + trading fees earned.
        """
        if not self.cyclr_wallet:
            return {"success": False, "error": "CYCLR wallet not configured"}
        
        try:
            # Get AMM info for LP token details
            amm_info = await self.get_amm_info()
            if not amm_info.get("success"):
                return {"success": False, "error": "Could not get AMM info"}
            
            lp_token = amm_info.get("lp_token", {})
            
            # Withdraw by burning LP tokens
            withdraw = AMMWithdraw(
                account=self.cyclr_wallet.classic_address,
                asset={"currency": "XRP"},
                asset2=IssuedCurrency(
                    currency=self.cusd_currency_code,
                    issuer=self.cusd_issuer
                ),
                lp_token_in=IssuedCurrencyAmount(
                    currency=lp_token.get("currency", ""),
                    issuer=lp_token.get("issuer", ""),
                    value=str(lp_tokens)
                ),
                flags=0x00080000  # tfSingleAsset - withdraw as CUSD only
            )
            
            response = await sign_and_submit(withdraw, wallet=self.cyclr_wallet, client=self.client)
            
            if response.is_successful():
                cusd_received = self._extract_cusd_received(response.result)
                
                print(f"✅ AMM Withdrawal: {lp_tokens} LP → {cusd_received} CUSD")
                
                return {
                    "success": True,
                    "tx_hash": response.result.get("tx_json", {}).get("hash"),
                    "lp_tokens_burned": lp_tokens,
                    "cusd_received": cusd_received,
                    # Backward compatibility
                    "rusd_received": cusd_received,
                    "product_id": product_id
                }
            else:
                return {
                    "success": False,
                    "error": response.result.get("engine_result_message", "Unknown error")
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _extract_lp_tokens(self, result: Dict) -> float:
        """Extract LP tokens received from AMM deposit result"""
        try:
            meta = result.get("meta", {})
            for node in meta.get("AffectedNodes", []):
                modified = node.get("ModifiedNode", {})
                if modified.get("LedgerEntryType") == "RippleState":
                    final = modified.get("FinalFields", {})
                    if "LPTokenBalance" in str(final):
                        # Parse LP token amount
                        balance = final.get("Balance", {})
                        if isinstance(balance, dict):
                            return abs(float(balance.get("value", 0)))
            return 0.0
        except:
            return 0.0
    
    def _extract_cusd_received(self, result: Dict) -> float:
        """Extract CUSD received from AMM withdraw result"""
        try:
            meta = result.get("meta", {})
            for node in meta.get("AffectedNodes", []):
                modified = node.get("ModifiedNode", {})
                if modified.get("LedgerEntryType") == "RippleState":
                    fields = modified.get("FinalFields", {})
                    prev_fields = modified.get("PreviousFields", {})
                    
                    # Check if this is CUSD (check both raw and hex)
                    currency = fields.get("HighLimit", {}).get("currency", "")
                    if currency == settings.CUSD_CURRENCY or currency == self.cusd_currency_code:
                        final_bal = float(fields.get("Balance", {}).get("value", 0))
                        prev_bal = float(prev_fields.get("Balance", {}).get("value", 0))
                        return abs(final_bal - prev_bal)
            return 0.0
        except:
            return 0.0
    
    # Backward compatibility alias
    def _extract_rusd_received(self, result: Dict) -> float:
        return self._extract_cusd_received(result)
    
    # ========================================
    # REWARD DISTRIBUTION
    # ========================================
    
    async def distribute_rewards(
        self,
        total_rusd: float,
        user_wallet: str,
        manufacturer_wallet: str,
        recycler_wallet: str,
        eco_fund_wallet: str,
        product_id: str
    ) -> Dict[str, Any]:
        """
        Distribute RUSD rewards according to the split:
        - 40% to user (who bought the product)
        - 20% to manufacturer
        - 20% to recycler
        - 20% to ecological fund
        """
        if not self.cyclr_wallet:
            return {"success": False, "error": "CYCLR wallet not configured"}
        
        # Calculate splits
        user_amount = total_rusd * (settings.USER_REWARD_PERCENT / 100)
        manufacturer_amount = total_rusd * (settings.MANUFACTURER_REWARD_PERCENT / 100)
        recycler_amount = total_rusd * (settings.RECYCLER_REWARD_PERCENT / 100)
        eco_amount = total_rusd * (settings.ECO_FUND_REWARD_PERCENT / 100)
        
        results = {
            "total_distributed": total_rusd,
            "product_id": product_id,
            "payments": {}
        }
        
        # Send to each party
        payments = [
            ("user", user_wallet, user_amount),
            ("manufacturer", manufacturer_wallet, manufacturer_amount),
            ("recycler", recycler_wallet, recycler_amount),
            ("eco_fund", eco_fund_wallet, eco_amount),
        ]
        
        for name, wallet, amount in payments:
            if not wallet or not wallet.startswith("r") or amount <= 0:
                results["payments"][name] = {"skipped": True, "reason": "Invalid wallet or zero amount"}
                continue
            
            try:
                payment_result = await self.send_rusd(
                    from_wallet=self.cyclr_wallet,
                    to_address=wallet,
                    amount=amount,
                    memo=f"CYCLR-{name}-reward-{product_id[:8]}"
                )
                results["payments"][name] = {
                    "amount": amount,
                    "tx_hash": payment_result.get("tx_hash"),
                    "success": payment_result.get("success", False)
                }
            except Exception as e:
                results["payments"][name] = {"error": str(e)}
            
            await asyncio.sleep(1)  # Rate limiting
        
        results["success"] = all(
            p.get("success", False) or p.get("skipped", False) 
            for p in results["payments"].values()
        )
        
        return results
    
    # ========================================
    # NFT OPERATIONS (Product Tracking)
    # ========================================
    
    async def mint_product_nft(
        self,
        product_name: str,
        product_price: float,
        deposit_amount: float,
        manufacturer_wallet: str
    ) -> Dict[str, Any]:
        """Mint NFT to track the product on-chain"""
        if not self.cyclr_wallet:
            return {"success": False, "error": "CYCLR wallet not configured"}
        
        # Build metadata URI
        metadata = {
            "name": product_name,
            "price": product_price,
            "deposit": deposit_amount,
            "manufacturer": manufacturer_wallet,
            "created": datetime.now(timezone.utc).isoformat()
        }
        uri = f"data:application/json,{json.dumps(metadata)}"
        
        mint = NFTokenMint(
            account=self.cyclr_wallet.classic_address,
            nftoken_taxon=1,  # CYCLR products
            flags=NFTokenMintFlag.TF_TRANSFERABLE,
            uri=uri.encode().hex(),
            memos=[
                Memo.from_dict({
                    "memo_data": product_name.encode().hex(),
                    "memo_type": "ProductName".encode().hex(),
                }),
                Memo.from_dict({
                    "memo_data": str(deposit_amount).encode().hex(),
                    "memo_type": "DepositRUSD".encode().hex(),
                })
            ]
        )
        
        response = await sign_and_submit(mint, wallet=self.cyclr_wallet, client=self.client)
        
        if response.is_successful():
            nft_id = self._extract_nft_id(response.result)
            return {
                "success": True,
                "nft_id": nft_id,
                "tx_hash": response.result.get("tx_json", {}).get("hash")
            }
        else:
            return {
                "success": False,
                "error": response.result.get("engine_result_message", "Unknown error")
            }
    
    def _extract_nft_id(self, result: Dict) -> Optional[str]:
        """Extract NFT ID from mint result"""
        try:
            meta = result.get("meta", {})
            for node in meta.get("AffectedNodes", []):
                created = node.get("CreatedNode", {})
                if created.get("LedgerEntryType") == "NFTokenPage":
                    nftokens = created.get("NewFields", {}).get("NFTokens", [])
                    if nftokens:
                        return nftokens[0]["NFToken"]["NFTokenID"]
                        
                modified = node.get("ModifiedNode", {})
                if modified.get("LedgerEntryType") == "NFTokenPage":
                    final = modified.get("FinalFields", {}).get("NFTokens", [])
                    if final:
                        return final[-1]["NFToken"]["NFTokenID"]
            return None
        except:
            return None


# Global service instance
xrpl_service = XRPLService()
