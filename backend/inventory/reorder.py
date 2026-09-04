"""
Reorder logic: Classic Reorder Point (ROP) model.

  ROP = (avg_daily_sales × lead_time_days) + safety_stock

  days_remaining = total_stock / avg_daily_sales

Urgency tiers
  CRITICAL  days_remaining ≤ lead_time_days   — will stockout before reorder arrives
  WARNING   total_stock ≤ ROP but not critical — at or below reorder point, order now
  OK        total_stock > ROP                  — adequately stocked

Products with avg_daily_sales == 0 are excluded (no sell-through data to reason from).
"""

from decimal import Decimal
from decimal import ROUND_CEILING


def calculate_reorder_quantity(product) -> int:
    """Return the whole-unit order quantity from the product's reorder inputs."""
    quantity = (
        Decimal(str(product.avg_daily_sales)) * product.lead_time_days
        + product.safety_stock
    )
    return int(quantity.to_integral_value(rounding=ROUND_CEILING))


def compute_reorder_status(product, total_stock: int) -> dict | None:
    daily = Decimal(str(product.avg_daily_sales))
    if daily <= 0:
        return None

    reorder_point = daily * product.lead_time_days + product.safety_stock
    days_remaining = Decimal(total_stock) / daily

    needs_reorder = total_stock <= reorder_point

    if days_remaining <= product.lead_time_days:
        urgency = "critical"
    elif needs_reorder:
        urgency = "warning"
    else:
        urgency = "ok"

    return {
        "total_stock": total_stock,
        "reorder_point": float(round(reorder_point, 1)),
        "days_remaining": float(round(days_remaining, 1)),
        "reorder_quantity": calculate_reorder_quantity(product),
        "needs_reorder": needs_reorder,
        "urgency": urgency,
    }
