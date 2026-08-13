import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function StockLevels() {
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");
  const [newForm, setNewForm] = useState({ product: "", warehouse: "", quantity: "" });
  const [filterProduct, setFilterProduct] = useState("");

  const load = () => {
    const params = filterProduct ? { product: filterProduct } : {};
    return api.getStock(params).then(setStock).catch((e) => setError(e.message));
  };

  useEffect(() => {
    Promise.all([api.getProducts(), api.getWarehouses()])
      .then(([p, w]) => { setProducts(p); setWarehouses(w); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [filterProduct]);

  const handleUpdateQty = async (id) => {
    setError(null);
    try {
      const sl = stock.find((s) => s.id === id);
      await api.updateStock(id, {
        product: sl.product, warehouse: sl.warehouse, quantity: parseInt(editQty, 10),
      });
      setEditingId(null);
      load();
    } catch (err) { setError(err.message); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.createStock({
        product: parseInt(newForm.product, 10),
        warehouse: parseInt(newForm.warehouse, 10),
        quantity: parseInt(newForm.quantity, 10),
      });
      setNewForm({ product: "", warehouse: "", quantity: "" });
      load();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this stock record?")) return;
    try { await api.deleteStock(id); load(); }
    catch (err) { setError(err.message); }
  };

  // Group by product for readability
  const grouped = stock.reduce((acc, sl) => {
    const key = sl.product;
    if (!acc[key]) acc[key] = { name: sl.product_name, sku: sl.product_sku, rows: [] };
    acc[key].rows.push(sl);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <h1>Stock Levels</h1>
        <p>Current inventory quantities per product and warehouse.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>Add Stock Record</h2>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="field" style={{ flex: "2 1 200px" }}>
              <label>Product *</label>
              <select value={newForm.product}
                      onChange={(e) => setNewForm((f) => ({ ...f, product: e.target.value }))} required>
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: "2 1 180px" }}>
              <label>Warehouse *</label>
              <select value={newForm.warehouse}
                      onChange={(e) => setNewForm((f) => ({ ...f, warehouse: e.target.value }))} required>
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: "1 1 100px" }}>
              <label>Quantity *</label>
              <input type="number" min="0" value={newForm.quantity}
                     onChange={(e) => setNewForm((f) => ({ ...f, quantity: e.target.value }))} required />
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary">Add</button>
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="filter-row">
          <h2 style={{ marginBottom: 0 }}>Stock Records</h2>
          <div className="field" style={{ flex: "0 0 220px", marginBottom: 0 }}>
            <select value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="empty-msg">No stock records yet.</div>
        ) : (
          Object.entries(grouped).map(([productId, group]) => (
            <div key={productId} style={{ marginBottom: 20 }}>
              <div className="section-title">
                <code>{group.sku}</code> — {group.name}
              </div>
              <table>
                <thead>
                  <tr><th>Warehouse</th><th>Quantity</th><th>Last Updated</th><th></th></tr>
                </thead>
                <tbody>
                  {group.rows.map((sl) => (
                    <tr key={sl.id}>
                      <td>{sl.warehouse_name}</td>
                      <td>
                        {editingId === sl.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input type="number" min="0" value={editQty}
                                   onChange={(e) => setEditQty(e.target.value)}
                                   style={{ width: 80 }} />
                            <button className="btn btn-primary btn-sm"
                                    onClick={() => handleUpdateQty(sl.id)}>Save</button>
                            <button className="btn btn-secondary btn-sm"
                                    onClick={() => setEditingId(null)}>✕</button>
                          </div>
                        ) : (
                          sl.quantity
                        )}
                      </td>
                      <td style={{ color: "#64748b", fontSize: 12 }}>
                        {new Date(sl.updated_at).toLocaleString()}
                      </td>
                      <td>
                        <div className="actions">
                          {editingId !== sl.id && (
                            <button className="btn btn-secondary btn-sm"
                                    onClick={() => { setEditingId(sl.id); setEditQty(sl.quantity); }}>
                              Edit
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sl.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </>
  );
}
