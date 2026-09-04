from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet, ProductViewSet, StockLevelViewSet, reorder_dashboard

router = DefaultRouter(trailing_slash=False)
router.register("warehouses", WarehouseViewSet)
router.register("products", ProductViewSet)
router.register("stock", StockLevelViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("reorder", reorder_dashboard, name="reorder-dashboard"),
]

