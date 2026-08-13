import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ReorderDashboard from "./pages/ReorderDashboard";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import StockLevels from "./pages/StockLevels";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav>
          <span className="brand">Inventory Tool</span>
          <NavLink to="/" end>Reorder Dashboard</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/warehouses">Warehouses</NavLink>
          <NavLink to="/stock">Stock Levels</NavLink>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<ReorderDashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/stock" element={<StockLevels />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
