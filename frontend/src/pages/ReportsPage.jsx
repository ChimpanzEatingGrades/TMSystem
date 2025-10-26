import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ReportFilters from "../components/reports/ReportFilters";
import SalesSummary from "../components/reports/SalesSummary";
import SalesCharts from "../components/reports/SalesCharts";
import InventoryTable from "../components/reports/InventoryTable";
import { getBranches, getRawMaterials, getStockTransactions, getRecipes } from "../api/inventoryAPI";
import { getPurchaseOrders } from "../api/inventoryAPI"; // Import function to get POs
import { getCustomerOrders } from "../api/orders";
import { Download } from "lucide-react";

const ReportsPage = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    reportType: 'sales',
    branchId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    // Fetch branches on initial load
    getBranches()
      .then(res => setBranches(res.data))
      .catch(() => setError("Failed to load branches."));
  }, []);
  
  useEffect(() => {
    // Fetch all recipes once for COGS calculation
    getRecipes()
      .then(res => setRecipes(res.data))
      .catch(() => console.error("Failed to load recipes for COGS calculation."));
  }, []);

  // --- Data Aggregation Functions (Frontend) ---

  const processSalesData = (orders, purchaseOrders, recipes) => {
    // 1. Calculate Average Cost of each Raw Material from Purchase Orders
    const materialCosts = {};
    const materialQuantities = {};

    purchaseOrders.forEach(po => {
      po.items.forEach(item => {
        // Use a consistent key for each material (name + unit)
        const materialKey = `${item.name.toLowerCase()}_${item.unit_abbreviation.toLowerCase()}`;
        materialCosts[materialKey] = (materialCosts[materialKey] || 0) + parseFloat(item.total_price);
        materialQuantities[materialKey] = (materialQuantities[materialKey] || 0) + parseFloat(item.quantity);
      });
    });

    const avgMaterialCost = {};
    for (const key in materialCosts) {
      if (materialQuantities[key] > 0) {
        avgMaterialCost[key] = materialCosts[key] / materialQuantities[key];
      }
    }

    // 2. Calculate COGS based on items sold
    let estimated_cogs = 0;
    orders.forEach(order => {
      order.items.forEach(orderItem => {
        const recipe = recipes.find(r => r.id === orderItem.menu_item_recipe_id);
        if (recipe) {
          recipe.items.forEach(recipeItem => {
            const materialKey = `${recipeItem.raw_material.name.toLowerCase()}_${recipeItem.raw_material.unit.toLowerCase()}`;
            const cost = avgMaterialCost[materialKey] || 0;
            const requiredQty = (parseFloat(recipeItem.quantity) * orderItem.quantity) / parseFloat(recipe.yield_quantity);
            estimated_cogs += requiredQty * cost;
          });
        }
      });
    });

    // 1. Calculate Summary
    const gross_sales = orders.reduce((acc, order) => acc + parseFloat(order.total_amount), 0);
    const total_orders = orders.length;
    const average_order_value = total_orders > 0 ? gross_sales / total_orders : 0;
    const net_income = gross_sales - estimated_cogs;

    const summary = {
      gross_sales,
      total_orders,
      average_order_value,
      estimated_cogs,
      net_income,
    };

    // 2. Calculate Sales Over Time
    const salesByDate = orders.reduce((acc, order) => {
      const date = order.order_date.split('T')[0];
      acc[date] = (acc[date] || 0) + parseFloat(order.total_amount);
      return acc;
    }, {});
    const sales_over_time = Object.entries(salesByDate)
      .map(([date, sales]) => ({ order_date__date: date, daily_sales: sales }))
      .sort((a, b) => new Date(a.order_date__date) - new Date(b.order_date__date));

    // 3. Calculate Top Products
    const productSales = orders.flatMap(order => order.items).reduce((acc, item) => {
      const name = item.menu_item_name;
      if (!acc[name]) {
        acc[name] = { total_revenue: 0, total_quantity_sold: 0 };
      }
      acc[name].total_revenue += parseFloat(item.total_price);
      acc[name].total_quantity_sold += item.quantity;
      return acc;
    }, {});
    const top_products = Object.entries(productSales)
      .map(([name, data]) => ({ menu_item__name: name, ...data }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10);

    // 4. Calculate Sales by Branch
    const salesByBranch = orders.reduce((acc, order) => {
      const branchName = order.branch_name || 'Unknown Branch';
      acc[branchName] = (acc[branchName] || 0) + parseFloat(order.total_amount);
      return acc;
    }, {});
    const sales_by_branch = Object.entries(salesByBranch)
      .map(([name, sales]) => ({ branch__name: name, total_sales: sales }));

    // 5. Process Peak Hours
    const hourlySales = orders.reduce((acc, order) => {
        const hour = new Date(order.order_date).getHours();
        acc[hour] = (acc[hour] || 0) + parseFloat(order.total_amount);
        return acc;
    }, {});

    const peak_hours = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        total_sales: hourlySales[i] || 0,
    }));


    setSalesData({ summary, sales_over_time, top_products, sales_by_branch, peak_hours });
  };

  const processInventoryData = async (branchId, startDate, endDate) => {
    const materialsRes = await getRawMaterials({ branch_id: branchId });
    const materials = materialsRes.data;

    const report = await Promise.all(materials.map(async (material) => {
      const transactionsRes = await getStockTransactions({
        raw_material_id: material.id,
        // Note: Your backend StockTransactionViewSet doesn't filter by date.
        // This will fetch ALL transactions for the material.
        // For accurate period reporting, the backend would need date filters.
      });
      const transactions = transactionsRes.data.filter(t => {
        const tDate = new Date(t.created_at);
        return tDate >= new Date(startDate) && tDate <= new Date(endDate + 'T23:59:59');
      });
      
      const usage = transactions.filter(t => t.transaction_type === 'stock_out').reduce((sum, t) => sum + Math.abs(parseFloat(t.quantity)), 0);
      const restocks = transactions.filter(t => t.transaction_type === 'stock_in').reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      return {
        material_id: material.id,
        material_name: material.name,
        material_unit: material.unit,
        current_quantity: material.quantity, // This is the branch-specific quantity from the getRawMaterials call
        total_usage: usage,
        total_restocks: restocks,
      };
    }));
    setInventoryData(report);
  };

  const handleApplyFilters = async () => {
    setLoading(true);
    setError('');
    setSalesData(null);
    setInventoryData(null);

    try {
      if (filters.reportType === 'sales') {
        const params = {
          date_from: filters.startDate,
          date_to: filters.endDate,
          branch_id: filters.branchId,
          status: 'completed',
        };
        const res = await getCustomerOrders(params);
        // Fetch all purchase orders to calculate COGS
        const poRes = await getPurchaseOrders();

        processSalesData(res.data, poRes.data, recipes);
      } else {
        if (!filters.branchId) {
          setError("Please select a branch to view the inventory report.");
          setLoading(false);
          return;
        }
        await processInventoryData(filters.branchId, filters.startDate, filters.endDate);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || `Failed to fetch ${filters.reportType} report.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleApplyFilters();
  }, []);

  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center p-20"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500"></div></div>;
    if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>;
    if (filters.reportType === 'sales' && salesData) return <><SalesSummary summary={salesData.summary} /><SalesCharts salesOverTime={salesData.sales_over_time} topProducts={salesData.top_products} salesByBranch={salesData.sales_by_branch} peakHours={salesData.peak_hours} /></>;
    if (filters.reportType === 'inventory') {
      const branchName = branches.find(b => b.id == filters.branchId)?.name;
      return <InventoryTable data={inventoryData} branchName={branchName} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
          <button className="mt-4 md:mt-0 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm flex items-center gap-2"><Download size={16} />Export</button>
        </div>
        <ReportFilters filters={filters} setFilters={setFilters} branches={branches} onApply={handleApplyFilters} />
        {renderContent()}
      </main>
    </div>
  );
};

export default ReportsPage;