"""
Seed the database with sample warehouses, products, and stock levels.

Intentionally creates a spread of urgency states so the dashboard is interesting:
  - several CRITICAL products (will stockout before reorder arrives)
  - several WARNING products (below reorder point)
  - a few OK products
"""

from django.core.management.base import BaseCommand
from inventory.models import Warehouse, Product, StockLevel


WAREHOUSES = [
    {"name": "East Coast", "location": "Newark, NJ"},
    {"name": "West Coast", "location": "Los Angeles, CA"},
    {"name": "Central",    "location": "Chicago, IL"},
]

# Fields: name, sku, avg_daily_sales, lead_time_days, safety_stock, reorder_quantity
# Stock: list of (warehouse_index, quantity) pairs
PRODUCTS = [
    {
        "name": "Hydration Bottle 32oz",
        "sku": "HB-32",
        "avg_daily_sales": 15,
        "lead_time_days": 7,
        "safety_stock": 30,
        "reorder_quantity": 300,
        # ROP = 15*7+30 = 135. total=30 → CRITICAL (2 days left)
        "stock": [(0, 20), (1, 10), (2, 0)],
    },
    {
        "name": "Resistance Band Set",
        "sku": "RB-SET",
        "avg_daily_sales": 8,
        "lead_time_days": 10,
        "safety_stock": 20,
        "reorder_quantity": 150,
        # ROP = 8*10+20 = 100. total=60 → CRITICAL (7.5 days, lead=10)
        "stock": [(0, 30), (1, 20), (2, 10)],
    },
    {
        "name": "Foam Roller Pro",
        "sku": "FR-PRO",
        "avg_daily_sales": 5,
        "lead_time_days": 14,
        "safety_stock": 25,
        "reorder_quantity": 100,
        # ROP = 5*14+25 = 95. total=50 → CRITICAL (10 days, lead=14)
        "stock": [(0, 25), (1, 15), (2, 10)],
    },
    {
        "name": "Protein Shaker 20oz",
        "sku": "PS-20",
        "avg_daily_sales": 20,
        "lead_time_days": 5,
        "safety_stock": 50,
        "reorder_quantity": 500,
        # ROP = 20*5+50 = 150. total=120 → WARNING (6 days, lead=5, but total<ROP)
        "stock": [(0, 60), (1, 40), (2, 20)],
    },
    {
        "name": "Yoga Mat Premium",
        "sku": "YM-PREM",
        "avg_daily_sales": 6,
        "lead_time_days": 12,
        "safety_stock": 15,
        "reorder_quantity": 120,
        # ROP = 6*12+15 = 87. total=80 → WARNING
        "stock": [(0, 40), (1, 25), (2, 15)],
    },
    {
        "name": "Jump Rope Speed",
        "sku": "JR-SPD",
        "avg_daily_sales": 10,
        "lead_time_days": 7,
        "safety_stock": 20,
        "reorder_quantity": 200,
        # ROP = 10*7+20 = 90. total=85 → WARNING
        "stock": [(0, 40), (1, 30), (2, 15)],
    },
    {
        "name": "Gym Gloves M",
        "sku": "GG-M",
        "avg_daily_sales": 12,
        "lead_time_days": 6,
        "safety_stock": 30,
        "reorder_quantity": 250,
        # ROP = 12*6+30 = 102. total=250 → OK
        "stock": [(0, 100), (1, 90), (2, 60)],
    },
    {
        "name": "Ankle Weights 5lb",
        "sku": "AW-5LB",
        "avg_daily_sales": 4,
        "lead_time_days": 8,
        "safety_stock": 10,
        "reorder_quantity": 80,
        # ROP = 4*8+10 = 42. total=200 → OK
        "stock": [(0, 80), (1, 70), (2, 50)],
    },
]


class Command(BaseCommand):
    help = "Seed sample warehouses, products, and stock levels"

    def handle(self, *args, **options):
        if Warehouse.objects.exists():
            self.stdout.write("Database already seeded — skipping.")
            return

        warehouses = []
        for w in WAREHOUSES:
            wh = Warehouse.objects.create(**w)
            warehouses.append(wh)
            self.stdout.write(f"  Warehouse: {wh.name}")

        for p in PRODUCTS:
            stock_plan = p.pop("stock")
            product = Product.objects.create(**p)
            self.stdout.write(f"  Product: {product.sku}")
            for wh_idx, qty in stock_plan:
                StockLevel.objects.create(
                    product=product,
                    warehouse=warehouses[wh_idx],
                    quantity=qty,
                )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(warehouses)} warehouses and {len(PRODUCTS)} products."
        ))
