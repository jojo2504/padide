# models.py
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import os
from xrpl_helpers import create_recyclable_item
from config import settings

@dataclass
class Product:
    """Represents one physical + digital recyclable item"""
    name: str
    deposit_xrp: float
    recycler_reward_percent: int = 70
    years_until_expiry: int = 10

    # Filled after creation on XRPL
    nft_id: Optional[str | Any] = None
    escrow_sequence: Optional[int | Any] = None
    qr_code_path: Optional[str | Any] = None
    recycle_url: Optional[str | Any] = None
    created_at: Optional[datetime] = None

    def __post_init__(self):
        self.created_at = datetime.now(timezone.utc)

    def produce(self) -> "Product":
        """Mints NFT + locks deposit on XRPL"""
        print(f"Manufacturing: {self.name} | Deposit: {self.deposit_xrp} XRP | {self.recycler_reward_percent}% to recycler")

        result = create_recyclable_item(
            product_name=self.name,
            deposit_xrp=self.deposit_xrp,
            recycler_percent=self.recycler_reward_percent,
            years=self.years_until_expiry
        )

        self.nft_id = result["nft_id"]
        self.escrow_sequence = result["escrow_sequence"]
        self.qr_code_path = result["qr_code"]
        self.recycle_url = result["scan_url"]

        print(f"Success! NFT: {self.nft_id[-8:]} | QR: {self.qr_code_path}")
        return self

    def show_qr(self):
        """Open QR code image (macOS/Linux/Windows)"""
        if self.qr_code_path and os.path.exists(self.qr_code_path):
            os.startfile(self.qr_code_path) if os.name == "nt" else os.system(f"open {self.qr_code_path}" if os.uname().sysname == "Darwin" else f"xdg-open {self.qr_code_path}")

    def __repr__(self) -> str:
        return f"<Product: {self.name} | {'Ready' if self.nft_id else 'Not produced'}>"

# models.py (continued)
class Factory:
    """RecycleFi Factory – produces circular economy products on XRPL"""
    
    def __init__(self, name: str = "GreenCycle Inc."):
        self.name = name
        self.products: Dict[str, Product] = {}
        self.catalog = {
            "Plastic Bottle 500ml":     Product("Plastic Bottle 500ml", deposit_xrp=5.0),
            "Aluminum Can 330ml":       Product("Aluminum Can 330ml", deposit_xrp=8.0, recycler_reward_percent=75),
            "PET Water Bottle 1L":      Product("PET Water Bottle 1L", deposit_xrp=6.5),
            "Glass Beer Bottle":        Product("Glass Beer Bottle", deposit_xrp=12.0, years_until_expiry=15),
            "HDPE Milk Jug 2L":         Product("HDPE Milk Jug 2L", deposit_xrp=7.0),
            "Yogurt Cup 150g":          Product("Yogurt Cup 150g", deposit_xrp=3.0),
            "Shampoo Bottle 400ml":     Product("Shampoo Bottle 400ml", deposit_xrp=10.0),
            "Energy Drink Can":         Product("Energy Drink Can", deposit_xrp=9.0, recycler_reward_percent=80),
        }
        print(f"Factory '{self.name}' ready | {len(self.catalog)} products in catalog")

    def list_catalog(self):
        print("\nAvailable products:")
        for name, prod in self.catalog.items():
            print(f"  • {name} → {prod.deposit_xrp} XRP deposit | {prod.recycler_reward_percent}% to recycler")

    def produce(self, product_name: str, quantity: int = 1) -> list[Product]:
        """Produce one or many items"""
        if product_name not in self.catalog:
            raise ValueError(f"Product '{product_name}' not in catalog")

        template = self.catalog[product_name]
        produced: list[Product] = []

        print(f"\nStarting production: {quantity}x {product_name}")
        for i in range(1, quantity + 1):
            item_name = f"{product_name} #{i:04d} [{datetime.now().strftime('%y%m%d')}]"
            item: Product = Product(
                name=item_name,
                deposit_xrp=template.deposit_xrp,
                recycler_reward_percent=template.recycler_reward_percent,
                years_until_expiry=template.years_until_expiry
            )
            item.produce()
            self.products[item.nft_id] = item
            produced.append(item)

            if i % 10 == 0:
                print(f"  → {i}/{quantity} produced...")

        print(f"Production complete! {quantity} items ready for distribution")
        return produced

    def mass_produce_all(self, quantity_per_type: int = 10):
        """DEMO MODE: Produce many of everything (judge wow effect)"""
        print(f"\nMASS PRODUCTION STARTED: {quantity_per_type} of each type")
        all_produced: list[Product] = []
        for name in self.catalog:
            all_produced.extend(self.produce(name, quantity_per_type))
        print(f"\nFactory produced {len(all_produced)} smart products!")
        print("Check /qrcodes folder → ready to print & demo!")
        return all_produced

    def get_product(self, nft_id: str) -> Optional[Product]:
        return self.products.get(nft_id)