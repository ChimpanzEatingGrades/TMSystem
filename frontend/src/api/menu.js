import api from "../api";


// Menu Items
export const getMenuItems = () => api.get("/inventory/menu-items/");
export const getMenuItem = (id) => api.get(`/inventory/menu-items/${id}/`);
export const createMenuItem = (data) =>
  api.post("/inventory/menu-items/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateMenuItem = (id, data) =>
  api.put(`/inventory/menu-items/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteMenuItem = (id) => api.delete(`/inventory/menu-items/${id}/`);

// Categories
export const getCategories = () => api.get("/inventory/categories/");

