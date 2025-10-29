import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#FFC601', '#DD7373', '#8A9A5B', '#6495ED', '#FF7F50'];
const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(value);

const SalesCharts = ({ salesOverTime, topProducts, salesByBranch, peakHours }) => {
  return (
    <div className="space-y-8">
      {/* Sales Over Time & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-4">Sales Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="order_date__date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis tickFormatter={(value) => `₱${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="daily_sales" name="Daily Sales" stroke="#FFC601" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `₱${value / 1000}k`} />
              <YAxis type="category" dataKey="menu_item__name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="total_revenue" fill="#DD7373" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Peak Hours & Branch Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-4">Peak Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis tickFormatter={(value) => `₱${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="total_sales" fill="#8A9A5B" name="Sales" />
                </BarChart>
            </ResponsiveContainer>
        </div>


        <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-semibold text-lg mb-4">Sales Distribution by Branch</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={salesByBranch}
              dataKey="total_sales"
              nameKey="branch__name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ branch__name, percent }) => `${branch__name} ${(percent * 100).toFixed(0)}%`}
            >
              {salesByBranch.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
};

export default SalesCharts;