import api from "../api";

// Stock Alerts
export const getStockAlerts = (params) => api.get("/inventory/stock-alerts/", { params });
export const getActiveAlerts = () => api.get("/inventory/stock-alerts/active/");
export const getAlertCounts = () => api.get("/inventory/stock-alerts/count/");
export const acknowledgeAlert = (id) => api.post(`/inventory/stock-alerts/${id}/acknowledge/`);
export const resolveAlert = (id) => api.post(`/inventory/stock-alerts/${id}/resolve/`);
export const checkAllMaterials = () => api.post("/inventory/stock-alerts/check_all_materials/");

// Material Status
export const getLowStockItems = () => api.get("/inventory/rawmaterials/low_stock_items/");
export const getExpiringSoon = () => api.get("/inventory/rawmaterials/expiring_soon/");
export const getExpiredMaterials = () => api.get("/inventory/rawmaterials/expired/");
