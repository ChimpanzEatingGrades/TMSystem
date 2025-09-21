"use client"

import { useState, useEffect } from "react"
import {
  RefreshCw,
  History,
  Filter,
  Calendar,
  Package,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react"
import api from "../../api"

const StockHistory = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({
    transaction_type: "",
    raw_material_id: "",
    user_id: "",
  })
  const [materials, setMaterials] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetchTransactions()
    fetchMaterials()
    fetchUsers()
  }, [filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.transaction_type) params.append("transaction_type", filters.transaction_type)
      if (filters.raw_material_id) params.append("raw_material_id", filters.raw_material_id)
      if (filters.user_id) params.append("user_id", filters.user_id)

      const res = await api.get(`/inventory/stock-transactions/?${params.toString()}`)
      setTransactions(res.data)
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError("Failed to fetch stock history")
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/inventory/rawmaterials/")
      setMaterials(res.data)
    } catch (err) {
      console.error("Error fetching materials:", err)
    }
  }

  const fetchUsers = async () => {
    try {
      // This would need a users endpoint - for now we'll skip it
      // const res = await api.get('/api/users/')
      // setUsers(res.data)
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatQuantity = (quantity, unit) => {
    const qty = Number.parseFloat(quantity)
    const sign = qty > 0 ? "+" : ""
    return `${sign}${qty} ${unit}`
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "stock_in":
        return "text-green-700 bg-green-100 border-green-200"
      case "stock_out":
        return "text-red-700 bg-red-100 border-red-200"
      case "adjustment":
        return "text-blue-700 bg-blue-100 border-blue-200"
      default:
        return "text-gray-700 bg-gray-100 border-gray-200"
    }
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "stock_in":
        return <TrendingUp size={14} />
      case "stock_out":
        return <TrendingDown size={14} />
      default:
        return <Package size={14} />
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      transaction_type: "",
      raw_material_id: "",
      user_id: "",
    })
  }

  const handleRefresh = () => {
    fetchTransactions()
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC601] mr-3"></div>
          <span className="text-gray-500">Loading stock history...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-black flex items-center gap-2">
          <History className="text-[#FFC601]" size={28} />
          Stock Transaction History
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter size={20} />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
              <select
                value={filters.transaction_type}
                onChange={(e) => handleFilterChange("transaction_type", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <select
                value={filters.raw_material_id}
                onChange={(e) => handleFilterChange("raw_material_id", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
              >
                <option value="">All Materials</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No stock transactions found</p>
            <p>Stock transactions will appear here as you manage your inventory</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Material</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Performed By</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reference</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${getTransactionTypeColor(transaction.transaction_type)}`}
                        >
                          {getTransactionIcon(transaction.transaction_type)}
                          {transaction.transaction_type_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                        <Package size={14} className="text-gray-400" />
                        {transaction.raw_material_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {formatQuantity(transaction.quantity, transaction.unit)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        {transaction.performed_by_name || transaction.performed_by_username || "System"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.reference_number ? (
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {transaction.reference_number}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {transaction.notes ? (
                          <div className="flex items-start gap-1">
                            <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="truncate">{transaction.notes}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockHistory
