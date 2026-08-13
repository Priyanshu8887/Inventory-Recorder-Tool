from django.db import models


class Warehouse(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)
    # Reorder logic inputs
    avg_daily_sales = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Average units sold per day"
    )
    lead_time_days = models.PositiveIntegerField(
        help_text="Days between placing and receiving an order"
    )
    safety_stock = models.PositiveIntegerField(
        help_text="Buffer units to hold above the reorder point"
    )
    reorder_quantity = models.PositiveIntegerField(
        help_text="Units to order when restocking"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sku} — {self.name}"


class StockLevel(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_levels")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="stock_levels")
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("product", "warehouse")

    def __str__(self):
        return f"{self.product.sku} @ {self.warehouse.name}: {self.quantity}"
