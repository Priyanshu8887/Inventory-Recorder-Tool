import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const URGENCY_LABEL = { critical: "Critical", warning: "Warning", ok: "OK" };

function ReorderCard({ item }) {
  const daysColor =
    item.urgency === "critical" ? "danger" : item.urgency === "warning" ? "warn" : "";

  return (
    <div className={`reorder-card ${item.urgency}`}>
      <div className="card-header">
        <div>
          <div className="card-title">{item.name}</div>
          <div className="card-sku">{item.sku}</div>
        </div>
        <span className={`badge badge-${item.urgency}`}>
          {URGENCY_LABEL[item.urgency]}
        </span>
      </div>

      <div className="reorder-stats">
        <div className="stat">
          <div className="label">Days of Stock</div>
          <div className={`value ${daysColor}`}>{item.days_remaining.toFixed(1)}</div>
        </div>
        <div className="stat">
          <div className="label">Total Stock</div>
          <div className="value">{item.total_stock}</div>
        </div>
        <div className="stat">
          <div className="label">Reorder Point</div>
          <div className="value">{item.reorder_point.toFixed(0)} units</div>
        </div>
        <div className="stat">
          <div className="label">Order Qty</div>
          <div className="value">{item.reorder_quantity}</div>
        </div>
      </div>

      <div className="section-title">Stock by Warehouse</div>
      <div className="warehouse-list">
        {item.stock_by_warehouse.map((s) => (
          <div className="warehouse-row" key={s.warehouse}>
            <span>{s.warehouse}</span>
            <span>{s.quantity} units</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
        {item.avg_daily_sales} units/day · {item.lead_time_days}d lead time ·{" "}
        {item.safety_stock} safety stock
      </div>
    </div>
  );
}

export default function ReorderDashboard() {
  const [items, setItems] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .getReorder(showAll)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [showAll]);

  useEffect(() => { load(); }, [load]);

  const critical = items.filter((i) => i.urgency === "critical");
  const warning  = items.filter((i) => i.urgency === "warning");
  const ok       = items.filter((i) => i.urgency === "ok");

  return (
    <>
      <div className="page-header">
        <h1>Reorder Dashboard</h1>
        <p>Products sorted by urgency — most critical first.</p>
      </div>

      <div className="filter-row">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all products (including adequately stocked)
        </label>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          Refresh
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="empty-msg">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-msg">No products need reordering right now.</div>
      ) : (
        <>
          {critical.length > 0 && (
            <>
              <div className="section-title" style={{ color: "#b91c1c" }}>
                Critical — {critical.length} product{critical.length !== 1 ? "s" : ""}
              </div>
              <div className="reorder-grid" style={{ marginBottom: 24 }}>
                {critical.map((item) => (
                  <ReorderCard key={item.product_id} item={item} />
                ))}
              </div>
            </>
          )}

          {warning.length > 0 && (
            <>
              <div className="section-title" style={{ color: "#92400e" }}>
                Warning — {warning.length} product{warning.length !== 1 ? "s" : ""}
              </div>
              <div className="reorder-grid" style={{ marginBottom: 24 }}>
                {warning.map((item) => (
                  <ReorderCard key={item.product_id} item={item} />
                ))}
              </div>
            </>
          )}

          {ok.length > 0 && showAll && (
            <>
              <div className="section-title" style={{ color: "#166534" }}>
                OK — {ok.length} product{ok.length !== 1 ? "s" : ""}
              </div>
              <div className="reorder-grid">
                {ok.map((item) => (
                  <ReorderCard key={item.product_id} item={item} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
