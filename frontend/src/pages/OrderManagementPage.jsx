import { useState } from "react";
import OrderManagement from "../components/Orders/OrderManagement";
import Navbar from "../components/Navbar";
import { Plus, QrCode } from "lucide-react";
import CartQRScanner from "../components/Orders/CartQRScanner";

const OrderManagementPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCartQRScanner, setShowCartQRScanner] = useState(false);
  const [scannedCartOrder, setScannedCartOrder] = useState(null);

  const handleCartOrderScanned = (orderData) => {
    console.log('Cart order scanned:', orderData);
    setScannedCartOrder(orderData);
    setShowCreateModal(true);
  };

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
          onClick={() => {
            setScannedCartOrder(null);
            setShowCreateModal(true);
          }}
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

      <OrderManagement 
        externalShowCreateModal={showCreateModal}
        externalSetShowCreateModal={setShowCreateModal}
        scannedCartOrder={scannedCartOrder}
        clearScannedCartOrder={() => setScannedCartOrder(null)}
      />
    </div>
  );
};

export default OrderManagementPage;
