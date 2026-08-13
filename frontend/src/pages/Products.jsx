import React, { useState, useEffect } from "react";
import { api } from "../api";

const EMPTY_FORM = {
  name: "", sku: "",
  avg_daily_sales: "", lead_time_days: "", safety_stock: "", reorder_quantity: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null); // product id
  const [error, setError] = useState(null);

  const load = () => api.getProducts().then(setProducts).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      avg_daily_sales: parseFloat(form.avg_daily_sales),
      lead_time_days: parseInt(form.lead_time_days, 10),
      safety_stock: parseInt(form.safety_stock, 10),
      reorder_quantity: parseInt(form.reorder_quantity, 10),
    };
    try {
      if (editing) {
        await api.updateProduct(editing, payload);
      } else {
        await api.createProduct(payload);
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name, sku: p.sku,
      avg_daily_sales: p.avg_daily_sales,
      lead_time_days: p.lead_time_days,
      safety_stock: p.safety_stock,
      reorder_quantity: p.reorder_quantity,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  return (
    <>
      <div className="page-header">
        <h1>Products</h1>
        <p>Manage product catalogue and reorder parameters.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>{editing ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field" style={{ flex: "2 1 180px" }}>
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="field" style={{ flex: "1 1 120px" }}>
              <label>SKU *</label>
              <input name="sku" value={form.sku} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="field" style={{ flex: "1 1 140px" }}>
              <label>Avg Daily Sales *</label>
              <input name="avg_daily_sales" type="number" step="0.01" min="0"
                     value={form.avg_daily_sales} onChange={handleChange} required
                     placeholder="units/day" />
            </div>
            <div className="field" style={{ flex: "1 1 120px" }}>
              <label>Lead Time (days) *</label>
              <input name="lead_time_days" type="number" min="1"
                     value={form.lead_time_days} onChange={handleChange} required />
            </div>
            <div className="field" style={{ flex: "1 1 120px" }}>
              <label>Safety Stock (units) *</label>
              <input name="safety_stock" type="number" min="0"
                     value={form.safety_stock} onChange={handleChange} required />
            </div>
            <div className="field" style={{ flex: "1 1 120px" }}>
              <label>Reorder Qty *</label>
              <input name="reorder_quantity" type="number" min="1"
                     value={form.reorder_quantity} onChange={handleChange} required />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              {editing ? "Save Changes" : "Add Product"}
            </button>
            {editing && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>All Products ({products.length})</h2>
        {products.length === 0 ? (
          <div className="empty-msg">No products yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Name</th><th>Daily Sales</th>
                <th>Lead (days)</th><th>Safety Stock</th><th>Reorder Qty</th><th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><code>{p.sku}</code></td>
                  <td>{p.name}</td>
                  <td>{p.avg_daily_sales}/day</td>
                  <td>{p.lead_time_days}d</td>
                  <td>{p.safety_stock}</td>
                  <td>{p.reorder_quantity}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
