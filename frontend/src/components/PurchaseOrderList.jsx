import React, { useState, useEffect } from 'react'
import api from '../api'

const PurchaseOrderList = ({ purchaseOrders: propPurchaseOrders, onPurchaseOrdersChange }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Use prop purchase orders directly, or empty array if not provided
  const purchaseOrders = propPurchaseOrders || []

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Delete Purchase Order #${orderId}? This cannot be undone.`)) return
    
    // Optimistic UI update - notify parent immediately
    const updatedOrders = purchaseOrders.filter(po => po.id !== orderId)
    if (onPurchaseOrdersChange) {
      onPurchaseOrdersChange(updatedOrders)
    }
    
    setInfo('')
    setError('')
    
    try {
      await api.delete(`/inventory/purchase-orders/${orderId}/`)
      setInfo(`Purchase Order #${orderId} deleted`)
    } catch (err) {
      console.error('Failed to delete purchase order:', err)
      setError(`Failed to delete order #${orderId}: ${err.response?.status || ''}`)
      // revert by notifying parent with original data
      if (onPurchaseOrdersChange) {
        onPurchaseOrdersChange(purchaseOrders)
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }


  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4">Recent Purchase Orders</h3>
      {info && (
        <div className="mb-3 bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded">
          {info}
        </div>
      )}
      
      {!purchaseOrders || purchaseOrders.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No purchase orders found.</p>
      ) : (
        <div className="space-y-4">
          {purchaseOrders.map((order) => (
            <div key={order.id} className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg">
                    Purchase Order #{order.id}
                  </h4>
                  <p className="text-gray-600">
                    Date: {formatDate(order.purchase_date)}
                  </p>
                  {order.encoded_by_name && (
                    <p className="text-gray-600 text-sm">
                      Encoded by: {order.encoded_by_name}
                    </p>
                  )}
                  {order.notes && (
                    <p className="text-gray-600 text-sm mt-1">
                      Notes: {order.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    Total: {formatCurrency(order.total_amount)}
                  </p>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Item</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Quantity</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Unit</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Unit Price</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2">{item.name}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.quantity}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.unit_abbreviation}</td>
                        <td className="border border-gray-300 px-3 py-2">{formatCurrency(item.unit_price)}</td>
                        <td className="border border-gray-300 px-3 py-2 font-medium">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PurchaseOrderList
