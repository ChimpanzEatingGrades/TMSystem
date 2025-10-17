import { useState, useEffect } from "react";
import OrderManagement, { CreateOrderModal } from "../components/Orders/OrderManagement";
import Navbar from "../components/Navbar";
import { Plus, QrCode } from "lucide-react";
import CartQRScanner from "../components/Orders/CartQRScanner";
import { getMenuItems, getBranches } from "../api/inventoryAPI";
import { createCustomerOrder } from "../api/orders";

const OrderManagementPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCartQRScanner, setShowCartQRScanner] = useState(false);
  const [scannedCartOrder, setScannedCartOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]); // To refresh the list after creation

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getMenuItems();
      const data = res.data?.results || res.data || [];
      setMenuItems(Array.isArray(data) ? data : []);

      const branchesRes = await getBranches();
      const branchesData = branchesRes.data?.results || branchesRes.data || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    };
    fetchInitialData();
  }, []);

  const handleCartOrderScanned = (orderData) => {
    console.log('=== CART ORDER SCANNED IN PAGE ===');
    console.log('Order data received:', orderData);
    console.log('Order data type:', typeof orderData);
    
    // Close scanner immediately
    setShowCartQRScanner(false);
    
    // The data should already be parsed from CartQRScanner
    if (orderData && orderData.type === 'CART_ORDER') {
      console.log('Valid CART_ORDER data received');
      
      // Map the items to include necessary fields
      const enhancedItems = orderData.items.map(item => {
        const menuItem = menuItems.find(mi => mi.id === item.menu_item);
        const availability = menuItem?.branch_availability?.find(
          a => String(a.branch) === String(orderData.branch)
        );
        
        return {
          ...item,
          menu_item_name: menuItem?.name || 'Unknown Item',
          unit_price: availability?.price != null ? parseFloat(availability.price) : 0,
        };
      });
      
      const parsedOrder = {
        customer_name: orderData.customer_name,
        special_requests: orderData.special_requests || '',
        notes: 'Order from cart QR scan',
        branch: orderData.branch ? String(orderData.branch) : '',
        items: enhancedItems,
      };

      console.log('Final parsed order:', parsedOrder);
      setScannedCartOrder(parsedOrder);
      
      // Automatically open create modal
      setShowCreateModal(true);
    } else {
      console.error('Invalid order data format:', orderData);
      alert('Invalid QR code format. Please scan a valid cart QR code.');
    }
  };

  const handleCreateOrder = async (newOrder) => {
    try {
      const response = await createCustomerOrder(newOrder);
      setOrders(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setScannedCartOrder(null);
      alert('Order created successfully!');
      return true;
    } catch (error) {
      console.error('Error creating order:', error);
      const errorData = error.response?.data;
      const errorMessage = errorData ? 
        (errorData.error || JSON.stringify(errorData)) : 
        'Failed to create order. Please check the console for details.';
      alert(errorMessage);
      return false;
    }
  };

  const handleManualCreate = () => {
    setScannedCartOrder(null);
    setShowCreateModal(true);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
        {/* Cart QR Scanner Button */}
        <button
          onClick={() => setShowCartQRScanner(true)}
          className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center group"
          title="Scan Cart QR Code"
        >
          <QrCode className="h-8 w-8 group-hover:scale-110 transition-transform" />
        </button>

        {/* Create Order Button */}
        <button
          onClick={handleManualCreate}
          className="w-16 h-16 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center group"
          title="Create New Order"
        >
          <Plus className="h-8 w-8 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Cart QR Scanner Modal */}
      <CartQRScanner
        isOpen={showCartQRScanner}
        onClose={() => setShowCartQRScanner(false)}
        onOrderScanned={handleCartOrderScanned}
      />

      {showCreateModal && (
        <CreateOrderModal
          initialOrderState={scannedCartOrder}
          menuItems={menuItems}
          branches={branches}
          onClose={() => {
            setShowCreateModal(false);
            setScannedCartOrder(null);
          }}
          onSubmit={handleCreateOrder}
        />
      )}

      <OrderManagement 
        key={orders.length} // Force re-render when orders change
      />
    </div>
  );
};

export default OrderManagementPage;
