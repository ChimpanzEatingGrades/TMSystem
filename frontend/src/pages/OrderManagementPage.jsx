import OrderManagement from "../components/Orders/OrderManagement";
import Navbar from "../components/Navbar";

const OrderManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <OrderManagement />
    </div>
  );
};

export default OrderManagementPage;
