# Inventory & Reorder Tool

A full-stack tool that answers the question: *"Which products do I need to reorder, and how urgently?"*

**Stack:** Django 5 · Django REST Framework · PostgreSQL · React 18 · Vite

---

## How to Run

### With Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:8000/api/

The database is migrated and seeded automatically on first start. Subsequent starts skip seeding if data exists.

### Without Docker

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Requires a running PostgreSQL instance
export DATABASE_URL=postgres://inventory:inventory@localhost:5432/inventory
python manage.py migrate
python manage.py seed
python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## Reorder Logic

### Chosen Approach: Reorder Point (ROP) Model

I used the classic **Reorder Point** formula, the industry-standard approach for first-version inventory tools:

```
Reorder Point (ROP) = (avg_daily_sales × lead_time_days) + safety_stock

Days of Stock Remaining = total_stock / avg_daily_sales
```

**Urgency tiers, sorted most-critical first:**

| Tier | Condition | Meaning |
|------|-----------|---------|
| **Critical** | `days_remaining ≤ lead_time_days` | Will stockout *before* the reorder could arrive |
| **Warning** | `total_stock ≤ ROP` (but not critical) | Below reorder point; order now to avoid future stockout |
| **OK** | `total_stock > ROP` | Adequately stocked |

Products with `avg_daily_sales = 0` are excluded — there's no sell-through rate to reason from.

### Why this approach

- **It matches what the customer actually knows.** A DTC brand's ops team can answer "how fast does this sell?" and "how long does it take to arrive?" far more readily than probability distributions or demand variability statistics.
- **It's well-understood and explainable.** The formula is the same one referenced in any introductory supply chain text (e.g. APICS, Investopedia's reorder point article). The customer can audit it themselves.
- **It captures the real risk.** The critical tier — "you'll stockout before the reorder arrives" — is the exact scenario that causes lost sales. Warning catches the pre-emptive case. Together they answer the "how urgently?" question the brief asked for.
- **It's the right v1 scope.** More sophisticated approaches (EOQ, service-level-based safety stock, demand variability buffers) would require historical order data and statistical modelling. That's a v2 problem once the team has built trust in the tool.

### Sources

- APICS Dictionary, "reorder point" definition
- Investopedia: [Reorder Point (ROP)](https://www.investopedia.com/terms/r/reorder-point.asp)
- Slack, John. et al. *Operations Management*, Pearson — Chapter 13 on inventory management

### Limitations

- **Assumes constant sales rate.** Seasonal products, trending SKUs, or recent promotions will make `avg_daily_sales` stale quickly. A v2 should compute this from an actual sales history table rather than a user-entered number.
- **Safety stock is a fixed buffer, not probabilistic.** The industry refinement is to size safety stock based on demand variability (`z × σ × √lead_time`). That requires historical data we don't have yet.
- **No multi-location reorder logic.** Reorder decisions are made on total stock across all warehouses. In practice, a warehouse might be stocked out while another has surplus — the tool doesn't model transfer vs. reorder decisions.
- **Lead time is constant.** Real lead times vary by supplier and season. This model treats it as deterministic.

---

## Data Model

```
Warehouse      name, location
Product      name, sku, avg_daily_sales, lead_time_days, safety_stock
StockLevel     product → Warehouse, quantity     [unique_together: product + warehouse]
```

The three fields added to Product beyond name/SKU (`avg_daily_sales`, `lead_time_days`, `safety_stock`) are the inputs used to calculate the dynamic order quantity:

```
Order Quantity = avg_daily_sales × lead_time_days + safety_stock
```

Because inventory quantities are whole units, fractional results are rounded up.

---

## API Reference

All endpoints return JSON.

| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/api/products` | List / create products |
| GET/PUT/DELETE | `/api/products/{id}` | Retrieve / update / delete product |
| GET/POST | `/api/warehouses` | List / create warehouses |
| GET/PUT/DELETE | `/api/warehouses/{id}` | Retrieve / update / delete warehouse |
| GET/POST | `/api/stock` | List / create stock levels |
| GET/PUT/DELETE | `/api/stock/{id}` | Retrieve / update / delete stock level |
| **GET** | **`/api/reorder`** | **Reorder dashboard — critical and warning products, sorted by urgency** |
| GET | `/api/reorder?all=1` | Same, but includes OK products too |

### Reorder endpoint response shape

```json
[
  {
    "product_id": 1,
    "name": "Hydration Bottle 32oz",
    "sku": "HB-32",
    "avg_daily_sales": 15.0,
    "lead_time_days": 7,
    "safety_stock": 30,
    "reorder_quantity": 135,
    "total_stock": 30,
    "reorder_point": 135.0,
    "days_remaining": 2.0,
    "needs_reorder": true,
    "urgency": "critical",
    "stock_by_warehouse": [
      {"warehouse": "East Coast", "quantity": 20},
      {"warehouse": "West Coast", "quantity": 10},
      {"warehouse": "Central", "quantity": 0}
    ]
  }
]
```

---

## Assumptions Made

- **avg_daily_sales is user-entered**, not computed from order history. The data model doesn't include an orders table because the brief didn't ask for one, and adding it would expand scope significantly. This is the biggest simplification.
- **Reorder quantity is advisory** — the dashboard shows what to order, but doesn't create purchase orders or track open orders. There's no "on-order" quantity that would reduce net need.
- **No authentication** — the brief didn't mention it, and adding auth would double the scope without testing the core logic.
- **Stock quantity can't go negative** — enforced at the DB level (`PositiveIntegerField`). In a real system you'd also want to validate inbound shipment receipts separately.
- **Seed data is idempotent** — the `seed` command checks for existing data and skips if any warehouses exist, so `docker compose up` can be run repeatedly safely.

---

## What I'd Do with More Time

1. **Compute avg_daily_sales from an orders table.** Add `Order` and `OrderLine` models, compute a rolling 30-day average. This removes the biggest manual step.
2. **Variability-based safety stock.** Use `z × σ_demand × √lead_time` to size safety stock statistically. Requires the sales history from point 1.
3. **Open purchase orders.** An `on_order` field (or a `PurchaseOrder` model) so the reorder logic can subtract incoming stock and avoid double-ordering.
4. **Per-warehouse reorder decisions.** Currently the dashboard aggregates across all warehouses. A more useful tool would flag individual warehouse stockouts and suggest transfer vs. reorder.
5. **Authentication & multi-tenancy.** Django's built-in auth + a `tenant` FK on all models to support multiple customers.
6. **Pagination and search.** Fine for the seed data size; needed at any real scale.
7. **Tests.** I'd add Django unit tests for the `compute_reorder_status` function (especially boundary conditions: stock exactly at ROP, zero stock, etc.) and at least one integration test for the `/api/reorder` endpoint.

---

## How I Used AI Tools

I used **Claude Code** (Claude claude-sonnet-4-6 via the VSCode extension) for this task. My approach:

- **Planning phase first.** Before writing any code I asked Claude to present a full plan — data model, reorder logic choice, API shape, frontend structure — and reviewed it myself before approving. This is the most important part of directing AI tools: you need to read and challenge the plan, not just accept it.
- **Infrastructure decisions were mine, not the model's.** Claude's initial plan assumed a simple "run Django locally, run React locally" setup with separate terminal processes. I explicitly redirected it to use Docker Compose instead — one command to start everything, services talking over a Docker network.
- **Justification required.** The reorder logic decision was explicitly mine: I researched the ROP formula, chose it for the reasons documented above, and asked Claude to implement *that specific approach* with *those specific inputs*. I didn't let the model decide the domain logic.
- **File-by-file review.** I read each generated file before proceeding. Key things I checked: the reorder urgency tiers matched my spec, the seed data produced all three urgency states, the API serializer matched the actual model fields.
- **Context management.** I kept a single focused conversation for the full task rather than starting fresh sessions, so the model had consistent context about design decisions made earlier. For a longer task I'd break it into phases (planning session → backend session → frontend session) to avoid context drift.
- **Known risk with AI-generated code:** the model produces plausible-looking code that can have subtle bugs (off-by-one in the urgency tiers, wrong field names in serializers). Manual review of the boundary conditions in `reorder.py` and the migration file was essential.
