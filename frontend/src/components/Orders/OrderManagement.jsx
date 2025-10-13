import { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Package, 
  XCircle, 
  Eye,
  Filter,
  Search,
  Calendar,
  User,
  DollarSign
} from "lucide-react";
import { 
  getCustomerOrders, 
  getOrderStats, 
  confirmOrder, 
  startPreparingOrder, 
  markOrderReady, 
  completeOrder, 
  cancelOrder,
  testOrdersAPI
} from "../../api/orders";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    customer_name: '',
    date_from: '',
    date_to: ''
  });

  const statusConfig = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: Clock, 
      label: 'Pending' 
    },
    confirmed: { 
      color: 'bg-blue-100 text-blue-800', 
      icon: CheckCircle, 
      label: 'Confirmed' 
    },
    preparing: { 
      color: 'bg-orange-100 text-orange-800', 
      icon: ChefHat, 
      label: 'Preparing' 
    },
    ready: { 
      color: 'bg-green-100 text-green-800', 
      icon: Package, 
      label: 'Ready' 
    },
    completed: { 
      color: 'bg-emerald-100 text-emerald-800', 
      icon: CheckCircle, 
      label: 'Completed' 
    },
    cancelled: { 
      color: 'bg-red-100 text-red-800', 
      icon: XCircle, 
      label: 'Cancelled' 
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getCustomerOrders(filters);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getOrderStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const testAPI = async () => {
    try {
      const response = await testOrdersAPI();
      console.log('API Test Response:', response.data);
      alert(`API Test Successful: ${response.data.message}`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API Test Failed: ${error.message}`);
    }
  };

  const handleStatusChange = async (orderId, action) => {
    try {
      let response;
      switch (action) {
        case 'confirm':
          response = await confirmOrder(orderId);
          break;
        case 'start_preparing':
          response = await startPreparingOrder(orderId);
          break;
        case 'mark_ready':
          response = await markOrderReady(orderId);
          break;
        case 'complete':
          response = await completeOrder(orderId);
          break;
        case 'cancel':
          response = await cancelOrder(orderId);
          break;
        default:
          return;
      }
      
      // Update the order in the list
      setOrders(orders.map(order => 
        order.id === orderId ? response.data : order
      ));
      
      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusActions = (status) => {
    switch (status) {
      case 'pending':
        return [
          { action: 'confirm', label: 'Confirm', color: 'bg-blue-500 hover:bg-blue-600' },
          { action: 'cancel', label: 'Cancel', color: 'bg-red-500 hover:bg-red-600' }
        ];
      case 'confirmed':
        return [
          { action: 'start_preparing', label: 'Start Preparing', color: 'bg-orange-500 hover:bg-orange-600' },
          { action: 'cancel', label: 'Cancel', color: 'bg-red-500 hover:bg-red-600' }
        ];
      case 'preparing':
        return [
          { action: 'mark_ready', label: 'Mark Ready', color: 'bg-green-500 hover:bg-green-600' },
          { action: 'cancel', label: 'Cancel', color: 'bg-red-500 hover:bg-red-600' }
        ];
      case 'ready':
        return [
          { action: 'complete', label: 'Complete', color: 'bg-emerald-500 hover:bg-emerald-600' }
        ];
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customer_name: '',
      date_from: '',
      date_to: ''
    });
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">Manage customer orders and track their status</p>
            </div>
            <button
              onClick={testAPI}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              Test API
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_orders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-gray-900">{stats.preparing_orders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ready_orders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.today_revenue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.customer_name}
                  onChange={(e) => handleFilterChange('customer_name', e.target.value)}
                  placeholder="Search customer..."
                  className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;
                  const statusColor = statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800';
                  const actions = getStatusActions(order.status);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {actions.map((action) => (
                            <button
                              key={action.action}
                              onClick={() => handleStatusChange(order.id, action.action)}
                              className={`px-3 py-1 text-xs font-medium text-white rounded-md ${action.color}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters' 
                  : 'No orders have been placed yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onStatusChange }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    preparing: { color: 'bg-orange-100 text-orange-800', icon: ChefHat },
    ready: { color: 'bg-green-100 text-green-800', icon: Package },
    completed: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
  };

  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusColor = statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800';

  const getStatusActions = (status) => {
    switch (status) {
      case 'pending':
        return [
          { action: 'confirm', label: 'Confirm Order', color: 'bg-blue-500 hover:bg-blue-600' },
          { action: 'cancel', label: 'Cancel Order', color: 'bg-red-500 hover:bg-red-600' }
        ];
      case 'confirmed':
        return [
          { action: 'start_preparing', label: 'Start Preparing', color: 'bg-orange-500 hover:bg-orange-600' },
          { action: 'cancel', label: 'Cancel Order', color: 'bg-red-500 hover:bg-red-600' }
        ];
      case 'preparing':
        return [
          { action: 'mark_ready', label: 'Mark as Ready', color: 'bg-green-500 hover:bg-green-600' },
          { action: 'cancel', label: 'Cancel Order', color: 'bg-red-500 hover:bg-red-600' }
        ];
      case 'ready':
        return [
          { action: 'complete', label: 'Complete Order', color: 'bg-emerald-500 hover:bg-emerald-600' }
        ];
      default:
        return [];
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const actions = getStatusActions(order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Order #{order.id} Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{order.customer_name}</span>
                  </div>
                  
                  {order.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{order.customer_phone}</span>
                    </div>
                  )}
                  
                  {order.customer_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{order.customer_email}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {order.status_display}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{formatDate(order.order_date)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {order.special_requests && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Special Requests</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">
                    {order.special_requests}
                  </p>
                </div>
              )}

              {order.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Staff Notes</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{item.menu_item_name}</h4>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.total_price)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Quantity: {item.quantity}</span>
                      <span>Price: {formatCurrency(item.unit_price)} each</span>
                    </div>
                    
                    {item.special_instructions && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Special Instructions:</strong> {item.special_instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                  
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="mt-8 flex justify-end space-x-3">
              {actions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => {
                    onStatusChange(order.id, action.action);
                    onClose();
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${action.color}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
