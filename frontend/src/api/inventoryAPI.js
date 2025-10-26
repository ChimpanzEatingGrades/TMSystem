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

// Menu Item Branch Availability
export const createMenuItemBranchAvailability = (data) => api.post("/inventory/menuitem-branch-availability/", data);
export const updateMenuItemBranchAvailability = (id, data) => api.put(`/inventory/menuitem-branch-availability/${id}/`, data);
export const deleteMenuItemBranchAvailability = (id) => api.delete(`/inventory/menuitem-branch-availability/${id}/`);

// Recipes
export const getRecipes = () => api.get("/inventory/recipes/");
export const createRecipe = (data) => api.post("/inventory/recipes/", data);
export const updateRecipe = (id, data) => api.put(`/inventory/recipes/${id}/`, data);
export const deleteRecipe = (id) => api.delete(`/inventory/recipes/${id}/`);

// units
// export const getUnits = () => api.get("/inventory/units/");
// export const createUnits = (data) => api.post("/inventory/units/", data);
// export const updateUnits = (id, data) => api.put(`/inventory/units/${id}/`, data);
// export const deleteUnits = (id) => api.delete(`/inventory/units/${id}/`);

// Raw Materials
export const getRawMaterials = (params) => api.get("/inventory/rawmaterials/", { params });
export const createRawMaterial = (data) => api.post("/inventory/rawmaterials/", data);
export const updateRawMaterial = (id, data) => api.put(`/inventory/rawmaterials/${id}/`, data);
export const deleteRawMaterial = (id) => api.delete(`/inventory/rawmaterials/${id}/`);

// Branches
export const getBranches = () => api.get("/inventory/branches/");
export const createBranch = (data) => api.post("/inventory/branches/", data);
export const updateBranch = (id, data) => api.put(`/inventory/branches/${id}/`, data);
export const deleteBranch = (id) => api.delete(`/inventory/branches/${id}/`);

// Stock Transactions
export const getStockTransactions = (params) => api.get("/inventory/stock-transactions/", { params });

// Purchase Orders
export const getPurchaseOrders = (params) => api.get("/inventory/purchase-orders/", { params });

export default api;
