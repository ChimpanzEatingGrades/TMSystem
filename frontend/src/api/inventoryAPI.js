import api from "../api";

// Categories
export const getCategories = () => api.get("/inventory/categories/");
export const createCategory = (data) => api.post("/inventory/categories/", data);
export const updateCategory = (id, data) => api.put(`/inventory/categories/${id}/`, data);
export const deleteCategory = (id) => api.delete(`/inventory/categories/${id}/`);

// Menu Items
export const getMenuItems = () => api.get("/inventory/menu-items/");
export const createMenuItem = (data) => api.post("/inventory/menu-items/", data);
export const updateMenuItem = (id, data) => api.put(`/inventory/menu-items/${id}/`, data);
export const deleteMenuItem = (id) => api.delete(`/inventory/menu-items/${id}/`);

// Recipes
export const getRecipes = () => api.get("/inventory/recipes/");
export const createRecipe = (data) => api.post("/inventory/recipes/", data);
export const updateRecipe = (id, data) => api.put(`/inventory/recipes/${id}/`, data);
export const deleteRecipe = (id) => api.delete(`/inventory/recipes/${id}/`);

// Raw Materials
export const getRawMaterials = () => api.get("/inventory/rawmaterials/");
export const createRawMaterial = (data) => api.post("/inventory/rawmaterials/", data);
export const updateRawMaterial = (id, data) => api.put(`/inventory/rawmaterials/${id}/`, data);
export const deleteRawMaterial = (id) => api.delete(`/inventory/rawmaterials/${id}/`);
