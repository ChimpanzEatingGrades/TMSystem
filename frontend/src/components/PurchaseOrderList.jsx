"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import api from "../api"

const PurchaseOrderList = ({ purchaseOrders: propPurchaseOrders, onPurchaseOrdersChange }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [expandedOrders, setExpandedOrders] = useState(new Set())

  // Use prop purchase orders directly, or empty array if not provided
  const purchaseOrders = propPurchaseOrders || []

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

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
      setTimeout(() => setInfo(""), 3000)
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Purchase Orders</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="text-[#FFC601]" size={24} />
          <h3 className="text-2xl font-bold text-gray-900">Recent Purchase Orders</h3>
          {purchaseOrders.length > 0 && (
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {purchaseOrders.length} orders
            </span>
          )}
        </div>
      </div>

      {/* Success Message */}
      {info && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
          <span className="text-green-800 font-medium">{info}</span>
        </div>
      )}

      {/* Empty State */}
      {!purchaseOrders || purchaseOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Create your first purchase order to start tracking your inventory purchases and manage your stock levels.
            </p>
          </div>
        </div>
      ) : (
        /* Purchase Orders List */
        <div className="space-y-4">
          {purchaseOrders.map((order) => {
            const isExpanded = expandedOrders.has(order.id)

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                {/* Order Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-900">Purchase Order #{order.id}</h4>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.items?.length || 0} items
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="font-medium">{formatDate(order.purchase_date)}</span>
                        </div>

                        {order.encoded_by_name && (
                          <div className="flex items-center gap-1.5">
                            <User size={16} className="text-gray-400" />
                            <span>by {order.encoded_by_name}</span>
                          </div>
                        )}

                        {order.notes && (
                          <div className="flex items-center gap-1.5">
                            <FileText size={16} className="text-gray-400" />
                            <span className="truncate max-w-xs">{order.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#FFC601]">{formatCurrency(order.total_amount)}</div>
                        <div className="text-sm text-gray-500 font-medium">Total Amount</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                          title={isExpanded ? "Hide details" : "Show details"}
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
                          title="Delete order"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && order.items && order.items.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <h5 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h5>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Item Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Quantity
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Unit
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Unit Price
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                  Total Price
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {order.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-700 font-medium">{item.quantity}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {item.unit_abbreviation}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-700">{formatCurrency(item.unit_price)}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {formatCurrency(item.total_price)}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PurchaseOrderList
