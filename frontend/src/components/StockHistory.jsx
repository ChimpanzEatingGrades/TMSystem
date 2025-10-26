"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import api from "../api"

const StockHistory = ({ selectedBranch }) => {
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
  const [sortOption, setSortOption] = useState("time_desc")
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (selectedBranch) {
      fetchTransactions()
      fetchMaterials()
      fetchUsers()
    }
  }, [filters, selectedBranch])

  const fetchTransactions = async () => {
    if (!selectedBranch) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()

      params.append("branch_id", selectedBranch)
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
    if (!selectedBranch) return
    
    try {
      const url = `/inventory/rawmaterials/?branch_id=${selectedBranch}`
      const res = await api.get(url)
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

  const formatDateTime = (dateString) => {
    if (!dateString) return "—"
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return "—"
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatQuantity = (quantity, unit) => {
    const qty = Number.parseFloat(quantity)
    const sign = qty > 0 ? "+" : ""
    return `${sign}${qty} ${unit}`
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case "stock_in":
        return "text-green-600 bg-green-100"
      case "stock_out":
        return "text-red-600 bg-red-100"
      case "adjustment":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
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
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading stock history...</div>
      </div>
    )
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime() || a.id || 0
    const db = new Date(b.created_at || 0).getTime() || b.id || 0
    switch (sortOption) {
      case "time_desc":
        return db - da
      case "time_asc":
        return da - db
      case "alpha_asc":
        return (a.raw_material_name || "").localeCompare(b.raw_material_name || "")
      case "alpha_desc":
        return (b.raw_material_name || "").localeCompare(a.raw_material_name || "")
      default:
        return 0
    }
  })
  const filteredTransactions = sortedTransactions.filter((t) => {
    const hay =
      `${t.raw_material_name || ""} ${t.transaction_type_display || ""} ${t.reference_number || ""}`.toLowerCase()
    return hay.includes(query.trim().toLowerCase())
  })

  const noResultsAfterFilter = transactions.length > 0 && filteredTransactions.length === 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        
        <div className="flex items-center gap-2 w-full max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Sort history"
          >
            <option value="time_desc">Newest</option>
            <option value="time_asc">Oldest</option>
            <option value="alpha_asc">A - Z</option>
            <option value="alpha_desc">Z - A</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded text-xs transition-colors duration-200"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}

      {/* Filters */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Filters</h4>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange("transaction_type", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Material</label>
            <select
              value={filters.raw_material_id}
              onChange={(e) => handleFilterChange("raw_material_id", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Materials</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={clearFilters}
              className="w-full px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-sm">No stock transactions found.</div>
          </div>
        ) : noResultsAfterFilter ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-sm">No results match the current search or filters.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatDateTime(transaction.created_at)}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}
                      >
                        {transaction.transaction_type_display}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="truncate max-w-20">{transaction.raw_material_name}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs">
                      <span className={transaction.quantity > 0 ? "text-green-600" : "text-red-600"}>
                        {formatQuantity(transaction.quantity, transaction.unit)}
                      </span>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="truncate max-w-16">
                        {transaction.performed_by_name || transaction.performed_by_username || "System"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockHistory
