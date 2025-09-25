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
  const [sortOption, setSortOption] = useState("time_desc")
  const [query, setQuery] = useState("")

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

  const sortedOrders = [...purchaseOrders].sort((a, b) => {
    const da = new Date(a.purchase_date || 0).getTime() || a.id || 0
    const db = new Date(b.purchase_date || 0).getTime() || b.id || 0
    switch (sortOption) {
      case "time_desc":
        return db - da
      case "time_asc":
        return da - db
      case "alpha_asc":
        return (a.encoded_by_name || a.notes || "").localeCompare(b.encoded_by_name || b.notes || "")
      case "alpha_desc":
        return (b.encoded_by_name || b.notes || "").localeCompare(a.encoded_by_name || a.notes || "")
      default:
        return 0
    }
  })

  const filteredOrders = sortedOrders.filter((o) => {
    const hay = `${o.encoded_by_name || ""} ${o.notes || ""} ${o.id}`.toLowerCase()
    return hay.includes(query.trim().toLowerCase())
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg border border-yellow-200">
              <Package className="text-yellow-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Purchase Orders</h3>
              {purchaseOrders.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 mt-1">
                  {purchaseOrders.length} orders
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search purchase orders..."
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            title="Sort purchase orders"
          >
            <option value="alpha_asc">A - Z</option>
            <option value="alpha_desc">Z - A</option>
            <option value="time_desc">Newest</option>
            <option value="time_asc">Oldest</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 max-h-96">
          {/* Success Message */}
          {info && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span className="text-green-800 font-medium text-sm">{info}</span>
            </div>
          )}

          {/* Empty State */}
          {!purchaseOrders || purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={32} className="mx-auto mb-2 text-gray-300" />
              <h3 className="text-sm font-medium mb-1">No Purchase Orders</h3>
              <p className="text-xs text-gray-600">
                Create your first purchase order to start tracking your inventory purchases.
              </p>
            </div>
          ) : (
            /* Purchase Orders List */
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrders.has(order.id)

                return (
                  <div
                    key={order.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Order Header */}
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-gray-900">PO #{order.id}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {order.items?.length || 0} items
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-1">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="font-medium">{formatDate(order.purchase_date)}</span>
                            </div>

                            {order.encoded_by_name && (
                              <div className="flex items-center gap-1">
                                <User size={12} className="text-gray-400" />
                                <span>by {order.encoded_by_name}</span>
                              </div>
                            )}

                            {order.notes && (
                              <div className="flex items-center gap-1">
                                <FileText size={12} className="text-gray-400" />
                                <span className="truncate max-w-xs">{order.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#FFC601]">{formatCurrency(order.total_amount)}</div>
                            <div className="text-xs text-gray-500 font-medium">Total</div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
                              title={isExpanded ? "Hide details" : "Show details"}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                              title="Delete order"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <div className="border-t border-gray-200 bg-white">
                        <div className="p-3">
                          <h5 className="text-sm font-semibold text-gray-900 mb-2">Order Items</h5>
                          <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Item
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Qty
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Unit
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Price
                                    </th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {order.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="text-xs font-medium text-gray-900">{item.name}</div>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="text-xs text-gray-700 font-medium">{item.quantity}</div>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          {item.unit_abbreviation}
                                        </span>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="text-xs text-gray-700">{formatCurrency(item.unit_price)}</div>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="text-xs font-semibold text-gray-900">
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
      </div>
    </div>
  )
}

export default PurchaseOrderList
