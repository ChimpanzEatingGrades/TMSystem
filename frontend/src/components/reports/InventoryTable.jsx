import React from 'react';

const InventoryTable = ({ data, branchName }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        <p>No inventory data to display for {branchName || 'the selected branch'}.</p>
        <p>Please select a branch and apply filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-4">Inventory Report for {branchName}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage (Period)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restocks (Period)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(item => (
              <tr key={item.material_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.material_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.current_quantity} {item.material_unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-red-600">{item.total_usage.toFixed(3)} {item.material_unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-green-600">{item.total_restocks.toFixed(3)} {item.material_unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;