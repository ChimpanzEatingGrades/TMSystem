import api from "../api";

// Customer Orders API
export const getCustomerOrders = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/inventory/customer-orders/${queryParams ? `?${queryParams}` : ''}`);
};

export const getCustomerOrder = (id) => api.get(`/inventory/customer-orders/${id}/`);

export const createCustomerOrder = (data) => 
  api.post("/inventory/customer-orders/", data);

export const updateCustomerOrder = (id, data) => 
  api.patch(`/inventory/customer-orders/${id}/`, data);

export const deleteCustomerOrder = (id) => 
  api.delete(`/inventory/customer-orders/${id}/`);

// Order Status Management
export const confirmOrder = (id) => 
  api.post(`/inventory/customer-orders/${id}/confirm/`);

export const startPreparingOrder = (id) => 
  api.post(`/inventory/customer-orders/${id}/start_preparing/`);

export const markOrderReady = (id) => 
  api.post(`/inventory/customer-orders/${id}/mark_ready/`);

export const completeOrder = (id) => 
  api.post(`/inventory/customer-orders/${id}/complete/`);

export const cancelOrder = (id) => 
  api.post(`/inventory/customer-orders/${id}/cancel/`);

// Order Statistics and Filtering
export const getPendingOrders = () => 
  api.get("/inventory/customer-orders/pending/");

export const getTodayOrders = () => 
  api.get("/inventory/customer-orders/today/");

export const getOrderStats = () => 
  api.get("/inventory/customer-orders/stats/");

// Order filtering helpers
export const getOrdersByStatus = (status) => 
  api.get(`/inventory/customer-orders/?status=${status}`);

export const getOrdersByCustomer = (customerName) => 
  api.get(`/inventory/customer-orders/?customer_name=${customerName}`);

export const getOrdersByDateRange = (dateFrom, dateTo) => 
  api.get(`/inventory/customer-orders/?date_from=${dateFrom}&date_to=${dateTo}`);

// Order validation helpers
export const validateOrderData = (orderData) => {
  const errors = {};
  
  if (!orderData.customer_name || orderData.customer_name.trim() === '') {
    errors.customer_name = 'Customer name is required';
  }
  
  if (!orderData.items || orderData.items.length === 0) {
    errors.items = 'At least one item is required';
  }
  
  if (orderData.items) {
    orderData.items.forEach((item, index) => {
      if (!item.menu_item) {
        errors[`items.${index}.menu_item`] = 'Menu item is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        errors[`items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Transform cart data to order format
export const transformCartToOrder = (cartData) => {
  return {
    customer_name: cartData.name || '',
    customer_phone: cartData.phone || '',
    customer_email: cartData.email || '',
    special_requests: cartData.requests || '',
    tax_amount: cartData.tax_amount || 0,
    notes: cartData.notes || '',
    items: cartData.cart.map(item => ({
      menu_item: item.id,
      quantity: item.quantity,
      special_instructions: item.special_instructions || ''
    }))
  };
};

// Test function to verify orders API is working
export const testOrdersAPI = () => 
  api.get("/inventory/customer-orders/test_orders/");
