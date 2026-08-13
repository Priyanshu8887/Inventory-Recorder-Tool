import React, { useState, useEffect } from "react";
import { api } from "../api";

const EMPTY_FORM = { name: "", location: "" };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  const load = () => api.getWarehouses().then(setWarehouses).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      editing
        ? await api.updateWarehouse(editing, form)
        : await api.createWarehouse(form);
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (w) => { setEditing(w.id); setForm({ name: w.name, location: w.location }); };
  const handleCancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  const handleDelete = async (id) => {
    if (!confirm("Delete this warehouse? This will also remove its stock records.")) return;
    try { await api.deleteWarehouse(id); load(); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <div className="page-header">
        <h1>Warehouses</h1>
        <p>Locations where stock is held.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <h2>{editing ? "Edit Warehouse" : "Add Warehouse"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="field" style={{ flex: "2 1 200px" }}>
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="field" style={{ flex: "3 1 250px" }}>
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleChange}
                     placeholder="City, State" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              {editing ? "Save Changes" : "Add Warehouse"}
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
        <h2>All Warehouses ({warehouses.length})</h2>
        {warehouses.length === 0 ? (
          <div className="empty-msg">No warehouses yet.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Location</th><th></th></tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.location || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(w)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)}>
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
