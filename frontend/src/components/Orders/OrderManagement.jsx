import { useState, useEffect, useRef } from "react";
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
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  Printer,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useReactToPrint } from 'react-to-print';
import OrderReceipt from './OrderReceipt';
import AdminVoidModal from './AdminVoidModal'; // Import the new modal
import { 
  getCustomerOrders, 
  getOrderStats, 
  confirmOrder, 
  startPreparingOrder, 
  markOrderReady, 
  completeOrder, 
  cancelOrder,
  testOrdersAPI,
  createCustomerOrder
} from "../../api/orders";
import { getMenuItems, getRawMaterials } from "../../api/inventoryAPI";
import api from "../../api"; // Keep for branches fetch

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showAdminVoidModal, setShowAdminVoidModal] = useState(false); // State for the new modal
  const [orderToVoid, setOrderToVoid] = useState(null); // State to hold the order being voided
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branch_id: '',
    status: '',
    customer_name: '',
    date_from: '',
    date_to: '',
  });
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

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
    // Load branches once
    const loadBranches = async () => {
      try {
        const res = await api.get('/inventory/branches/');
        setBranches(res.data);
        // If no branch selected, default to first branch
        if (!filters.branch_id && res.data?.length) {
          setFilters(prev => ({ ...prev, branch_id: String(res.data[0].id) }));
        }
      } catch (e) {
        console.error('Failed to load branches', e);
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    if (filters.branch_id !== undefined) {
      fetchOrders();
      fetchStats();
    }
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
      const response = await getOrderStats({ branch_id: filters.branch_id || undefined });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusChange = async (orderId, action, isAuthorized = false) => {
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
          // If authorization has already been given, cancel immediately.
          if (isAuthorized) {
            response = await cancelOrder(orderId);
            break;
          }

          const orderToCancel = orders.find(o => o.id === orderId);
          // If order is pending, cancel without admin void. Otherwise, trigger modal.
          if (orderToCancel && orderToCancel.status === 'pending') {
            response = await cancelOrder(orderId);
          } else if (orderToCancel) {
            setOrderToVoid(orderToCancel);
            setShowAdminVoidModal(true);
            return; // <-- FIX: Stop execution here to let the modal handle the rest.
          }
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
    setFilters(prev => ({
      branch_id: prev.branch_id, // keep current branch selection
      status: '',
      customer_name: '',
      date_from: '',
      date_to: ''
    }));
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-Order-${receiptOrder?.id || 'unknown'}`,
    onBeforePrint: () => {
      console.log('Preparing to print...')
    },
    onAfterPrint: () => {
      console.log('Print completed or cancelled')
    },
    onPrintError: (error) => {
      console.error('Print error:', error)
      alert('Failed to print receipt. Please try again.')
    },
  })

  const openReceipt = (order) => {
    setReceiptOrder(order)
    setShowReceipt(true)
  }

  const printReceipt = () => {
    if (!receiptRef.current) {
      console.error('Receipt ref is not available')
      alert('Receipt preview not available. Please try again.')
      return
    }

    // Confirm before printing
    const confirmed = window.confirm(
      `Print receipt for Order #${receiptOrder?.id}?\n\n` +
      `Customer: ${receiptOrder?.customer_name}\n` +
      `Total: ₱${receiptOrder?.total_amount}\n\n` +
      `This will open your printer dialog.`
    )

    if (confirmed) {
      handlePrint()
    }
  }

  // Calculate pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">Manage customer orders and track their status</p>
            </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={filters.branch_id}
                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>
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
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Orders {orders.length > 0 && `(${orders.length} total)`}
            </h3>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              title="Refresh orders"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
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
                {currentOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;
                  const statusColor = statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800';
                  const actions = getStatusActions(order.status);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.branch_name || 'N/A'}
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
                          <button
                            onClick={() => openReceipt(order)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Print Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
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

          {/* Pagination */}
          {orders.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastOrder, orders.length)}
                      </span>{' '}
                      of <span className="font-medium">{orders.length}</span> orders
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          pageNumber === 1 || 
                          pageNumber === totalPages || 
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                        
                        const showEllipsis = 
                          (pageNumber === 2 && currentPage > 3) ||
                          (pageNumber === totalPages - 1 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return (
                            <span
                              key={pageNumber}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-yellow-50 border-yellow-500 text-yellow-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Void Modal */}
      {showAdminVoidModal && orderToVoid && (
        <AdminVoidModal
          order={orderToVoid}
          onClose={() => {
            setShowAdminVoidModal(false);
            setOrderToVoid(null);
          }}
          onConfirm={async () => {
            // This function is called by the modal on successful authorization
            await handleStatusChange(orderToVoid.id, 'cancel', true);
            setShowAdminVoidModal(false);
            setOrderToVoid(null);
          }}
        />
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Order Details #{selectedOrder.id}</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600 mt-1">Order Date: {formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Order Status</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                    {statusConfig[selectedOrder.status]?.label}
                  </span>
                </div>
              </div>

              {selectedOrder.special_requests && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Special Requests</h3>
                  <p className="text-gray-900">{selectedOrder.special_requests}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Order Items</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.menu_item_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receiptOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Receipt Preview</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4">
              <div ref={receiptRef}>
                <OrderReceipt order={receiptOrder} />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowReceipt(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={printReceipt}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

// CreateOrderModal Component
export const CreateOrderModal = ({ initialOrderState, menuItems, branches, onClose, onSubmit }) => {
  // ...existing CreateOrderModal code...
};
