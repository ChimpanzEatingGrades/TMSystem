import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react';

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);

const KPICard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    {React.createElement(icon, { className: `text-${color}-500 mb-2`, size: 28 })}
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const SalesSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <KPICard title="Gross Sales" value={formatCurrency(summary.gross_sales)} icon={DollarSign} color="green" />
      <KPICard title="Net Income" value={formatCurrency(summary.net_income)} icon={TrendingUp} color="yellow" />
      <KPICard title="Estimated COGS" value={formatCurrency(summary.estimated_cogs)} icon={AlertTriangle} color="red" />
      <KPICard title="Total Orders" value={summary.total_orders} icon={ShoppingCart} color="blue" />
      <KPICard title="Avg. Order Value" value={formatCurrency(summary.average_order_value)} icon={BarChart2} color="purple" />
    </div>
  );
};

export default SalesSummary;