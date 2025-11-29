import requests
import json

# API base URL
BASE_URL = "http://localhost:8000"

def test_factory_produce():
    """Simulate manufacturer creating a product"""
    
    print("🏭 Factory producing new recyclable item...\n")
    
    # Call the factory/produce endpoint
    response = requests.post(
        f"{BASE_URL}/api/v1/factory/produce",
        data={
            "product_name": "Plastic Bottle 500ml",
            "deposit_xrp": 0.001
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Product created successfully!")
        print(f"   Product: {result['product']}")
        print(f"   NFT ID: {result['nft_id']}")
        print(f"   QR Code: {result['qr_code']}")
        print(f"   Scan URL: {result['scan_to_recycle']}")
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

def test_root():
    """Check API status"""
    response = requests.get(f"{BASE_URL}/")
    print("📊 API Status:")
    print(json.dumps(response.json(), indent=2))
    print()

if __name__ == "__main__":
    # Check API is running
    test_root()
    
    # Produce one item
    product = test_factory_produce()
    
    # Produce multiple items
    print("\n" + "="*50)
    print("Creating 3 more products...\n")
    
    products = [
        ("Aluminum Can 330ml", 8.0),
        ("Glass Bottle 750ml", 15.0),
        ("Plastic Bottle 1L", 12.0)
    ]
    
    for name, deposit in products:
        print(f"\n🏭 Producing: {name}")
        requests.post(
            f"{BASE_URL}/api/v1/factory/produce",
            data={"product_name": name, "deposit_xrp": deposit}
        )