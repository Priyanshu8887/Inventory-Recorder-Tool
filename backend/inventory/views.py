from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Warehouse, Product, StockLevel
from .serializers import (
    WarehouseSerializer, ProductSerializer,
    StockLevelSerializer, ReorderItemSerializer,
)
from .reorder import compute_reorder_status


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all().order_by("name")
    serializer_class = WarehouseSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("sku")
    serializer_class = ProductSerializer


class StockLevelViewSet(viewsets.ModelViewSet):
    queryset = StockLevel.objects.select_related("product", "warehouse").order_by(
        "product__sku", "warehouse__name"
    )
    serializer_class = StockLevelSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get("product")
        warehouse_id = self.request.query_params.get("warehouse")
        if product_id:
            qs = qs.filter(product_id=product_id)
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)
        return qs


@api_view(["GET"])
def reorder_dashboard(request):
    """
    Returns every product that needs reordering (urgency = critical or warning),
    sorted most urgent first (lowest days_remaining first).

    Pass ?all=1 to include OK products too (useful for the full dashboard view).
    """
    show_all = request.query_params.get("all") == "1"

    products = Product.objects.prefetch_related("stock_levels__warehouse").all()

    results = []
    for product in products:
        stock_levels = product.stock_levels.all()
        total_stock = sum(sl.quantity for sl in stock_levels)

        status_data = compute_reorder_status(product, total_stock)
        if status_data is None:
            continue

        if not show_all and not status_data["needs_reorder"]:
            continue

        results.append({
            "product_id": product.id,
            "name": product.name,
            "sku": product.sku,
            "avg_daily_sales": float(product.avg_daily_sales),
            "lead_time_days": product.lead_time_days,
            "safety_stock": product.safety_stock,
            "reorder_quantity": product.reorder_quantity,
            "stock_by_warehouse": [
                {"warehouse": sl.warehouse.name, "quantity": sl.quantity}
                for sl in stock_levels
            ],
            **status_data,
        })

    # Sort: critical first, then warning, then ok; within tier sort by days_remaining asc
    urgency_order = {"critical": 0, "warning": 1, "ok": 2}
    results.sort(key=lambda r: (urgency_order[r["urgency"]], r["days_remaining"]))

    serializer = ReorderItemSerializer(results, many=True)
    return Response(serializer.data)
