"use client"

import { useState } from "react"
import { ShoppingCart, Calendar, User, FileText, Trash2, Package, AlertTriangle, CheckCircle } from "lucide-react"
import api from "../../api"

const PurchaseOrderList = ({ purchaseOrders: propPurchaseOrders, onPurchaseOrdersChange }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  // Use prop purchase orders directly, or empty array if not provided
  const purchaseOrders = propPurchaseOrders || []

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Delete Purchase Order #${orderId}? This cannot be undone.`)) return

    // Optimistic UI update - notify parent immediately
    const updatedOrders = purchaseOrders.filter((po) => po.id !== orderId)
    if (onPurchaseOrdersChange) {
      onPurchaseOrdersChange(updatedOrders)
    }

    setInfo("")
    setError("")

    try {
      await api.delete(`/inventory/purchase-orders/${orderId}/`)
      setInfo(`Purchase Order #${orderId} deleted`)
    } catch (err) {
      console.error("Failed to delete purchase order:", err)
      setError(`Failed to delete order #${orderId}: ${err.response?.status || ""}`)
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertTriangle size={18} />
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-black flex items-center gap-2">
          <ShoppingCart className="text-[#FFC601]" size={24} />
          Recent Purchase Orders
        </h3>
      </div>

      {info && (
        <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          {info}
        </div>
      )}

      <div className="p-6">
        {!purchaseOrders || purchaseOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No purchase orders found</p>
            <p>Create your first purchase order to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {purchaseOrders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Package size={20} className="text-[#FFC601]" />
                      Purchase Order #{order.id}
                    </h4>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDate(order.purchase_date)}
                      </div>
                      {order.encoded_by_name && (
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          {order.encoded_by_name}
                        </div>
                      )}
                    </div>
                    {order.notes && (
                      <div className="flex items-start gap-1 text-sm text-gray-600">
                        <FileText size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{order.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(order.total_amount)}</p>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 rounded-tl-lg">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 rounded-tr-lg">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {order.items &&
                        order.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                {item.unit_abbreviation}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {formatCurrency(item.total_price)}
                            </td>
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
    </div>
  )
}

export default PurchaseOrderList
