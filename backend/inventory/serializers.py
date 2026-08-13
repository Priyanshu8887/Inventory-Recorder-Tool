from rest_framework import serializers
from .models import Warehouse, Product, StockLevel


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class StockLevelSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    product_sku = serializers.ReadOnlyField(source="product.sku")
    warehouse_name = serializers.ReadOnlyField(source="warehouse.name")

    class Meta:
        model = StockLevel
        fields = ["id", "product", "product_name", "product_sku",
                  "warehouse", "warehouse_name", "quantity", "updated_at"]


class ReorderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    name = serializers.CharField()
    sku = serializers.CharField()
    avg_daily_sales = serializers.FloatField()
    lead_time_days = serializers.IntegerField()
    safety_stock = serializers.IntegerField()
    reorder_quantity = serializers.IntegerField()
    total_stock = serializers.IntegerField()
    reorder_point = serializers.FloatField()
    days_remaining = serializers.FloatField()
    needs_reorder = serializers.BooleanField()
    urgency = serializers.ChoiceField(choices=["critical", "warning", "ok"])
    stock_by_warehouse = serializers.ListField(child=serializers.DictField())
