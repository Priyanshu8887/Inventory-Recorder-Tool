const BASE = "/api";

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Products
  getProducts: ()          => request("GET",    "/products"),
  createProduct: (data)    => request("POST",   "/products", data),
  updateProduct: (id, data)=> request("PUT",    `/products/${id}`, data),
  deleteProduct: (id)      => request("DELETE", `/products/${id}`),

  // Warehouses
  getWarehouses: ()           => request("GET",    "/warehouses"),
  createWarehouse: (data)     => request("POST",   "/warehouses", data),
  updateWarehouse: (id, data) => request("PUT",    `/warehouses/${id}`, data),
  deleteWarehouse: (id)       => request("DELETE", `/warehouses/${id}`),

  // Stock levels
  getStock: (params = {})   => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/stock${qs ? "?" + qs : ""}`);
  },
  createStock: (data)       => request("POST",   "/stock", data),
  updateStock: (id, data)   => request("PUT",    `/stock/${id}`, data),
  deleteStock: (id)         => request("DELETE", `/stock/${id}`),

  // Reorder dashboard
  getReorder: (showAll = false) =>
    request("GET", `/reorder${showAll ? "?all=1" : ""}`),
};
