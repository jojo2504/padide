# test_factory.py
from models import Factory

if __name__ == "__main__":
    # Create your factory
    factory = Factory("EcoFuture Industries ™")

    # Show what you can make
    factory.list_catalog()

    # Produce a few items
    factory.produce("Plastic Bottle 500ml")
    # factory.produce("Aluminum Can 330ml", quantity=3)

    # Or go full DEMO MODE (prints 80+ QR codes in <3 min)
    # print("\nStarting DEMO mass production...")
    # factory.mass_produce_all(quantity_per_type=8)  # 64 items in ~2 minutes

    # Show one QR code (uncomment to test)
    list(factory.products.values())[0].show_qr()