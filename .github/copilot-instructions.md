# Copilot instructions for Inventory & Reorder Tool

## Project snapshot

This repository contains a full-stack inventory reorder app:
- Backend: Django 5 + Django REST Framework + PostgreSQL
- Frontend: React 18 + Vite
- Local orchestration: Docker Compose

The business logic is deliberately centered in the backend reorder model rather than spread across the UI. The important domain logic lives in `backend/inventory/reorder.py`, while the API and UI are thin layers around it.

## Build, test, and lint commands

### Preferred local startup

```bash
docker compose up --build
```

- Frontend: http://localhost:3001
- Backend API: http://localhost:8000/api/

### Backend (without Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgres://inventory:inventory@localhost:5432/inventory
python manage.py migrate
python manage.py seed
python manage.py runserver
```

Useful backend checks:

```bash
cd backend
python manage.py check
```

There is no dedicated backend lint configuration in this repo today.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
cd frontend
npm run build
```

There is no lint script configured in `frontend/package.json` and no automated frontend test runner is set up in the repository.

### Test commands

This repo does not currently include a test suite or a configured test runner. If tests are added later, prefer Django's built-in runner for a single app or file:

```bash
cd backend
python manage.py test inventory
python manage.py test inventory.tests.test_reorder
```

For the frontend, there is no test command configured yet.

## High-level architecture

### Backend

`backend/config/settings.py` configures Django, DRF, CORS, and the PostgreSQL connection. `backend/config/urls.py` wires the app routes.

The domain model is defined in `backend/inventory/models.py`:
- `Warehouse`: physical stock locations
- `Product`: reorder inputs and product metadata
- `StockLevel`: per-product, per-warehouse inventory quantity

The core reorder algorithm is intentionally isolated in `backend/inventory/reorder.py`:
- Reorder point = `(avg_daily_sales * lead_time_days) + safety_stock`
- `days_remaining = total_stock / avg_daily_sales`
- Products with `avg_daily_sales <= 0` are excluded from the reorder logic
- Urgency is computed as `critical` / `warning` / `ok` based on stock remaining versus the reorder point and lead time

`backend/inventory/views.py` provides the API surface:
- standard CRUD viewsets for products, warehouses, and stock records
- `reorder_dashboard` endpoint for the urgent items dashboard
- `?all=1` includes non-urgent products in the response

`backend/inventory/serializers.py` serializes the model objects and the reorder response payload.

### Frontend

`frontend/src/api.js` is the centralized API client. Pages under `frontend/src/pages/` call this client and render the list/edit views for products, warehouses, and stock levels. The dashboard view is the app's main operational screen.

The frontend is a simple Vite React app and does not contain a separate state management layer or client-side business logic for reorder calculations; it mostly consumes the backend API.

### Data flow and conventions

- The canonical inventory source of truth is the PostgreSQL database.
- The backend computes reorder urgency from aggregated stock across all warehouses for a product.
- `StockLevel` entries are unique per `product + warehouse` pair.
- The API is JSON-first and is designed for CRUD operations plus a reorder dashboard response.

## Key conventions

- Docker Compose is the preferred developer workflow; it starts Postgres, the backend, and the frontend in a single command.
- Reorder logic should not be reimplemented in the UI. If a change is needed, make it in `backend/inventory/reorder.py` and ensure the API response reflects it.
- Product-level reorder inputs are intentionally explicit: `avg_daily_sales`, `lead_time_days`, and `safety_stock` are the source-of-truth business inputs. `reorder_quantity` is calculated as `(avg_daily_sales * lead_time_days) + safety_stock`.
- Keep the dashboard ordering consistent with the backend: highest urgency first (`critical` before `warning` before `ok`), then by `days_remaining` ascending.
- `needs_reorder` is treated as `total_stock <= reorder_point`; the code does not model open purchase orders or on-order inventory.
- Seed data is idempotent via `backend/inventory/management/commands/seed.py`; repeated `docker compose up` runs should not recreate an already-seeded database.
- The frontend does not currently include a dedicated lint/test setup, so do not add new frontend tooling unless the project explicitly moves in that direction.

## Existing guidance and repo-specific notes

- The README documents the reorder model as a classic Reorder Point (ROP) approach and is the authoritative explanation for urgency tiers and assumptions.
- The project intentionally keeps scope narrow: no auth, no order-history modeling, and no multi-tenant logic.
- When working on the reorder logic, be careful with boundary cases around zero stock, zero sales, and values exactly at the reorder point.
