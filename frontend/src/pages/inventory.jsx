"use client"
import { useState, useEffect } from "react"
import {
  Package,
  Plus,
  ShoppingCart,
  Minus,
  History,
  Settings,
  Trash2,
  Edit3,
  Save,
  X,
  AlertTriangle,
} from "lucide-react"
import api from "../api"
import Navbar from "../components/Navbar"
import PurchaseOrderModal from "../components/PurchaseOrderModal"
import UnitManagementModal from "../components/UnitManagementModal"
import PurchaseOrderList from "../components/PurchaseOrderList"
import StockOutModal from "../components/StockOutModal"
import StockHistory from "../components/StockHistory"
import ClearInventoryModal from "../components/ClearInventoryModal"
import ErrorBoundary from "../components/ErrorBoundary"

export default function Inventory() {
  const [materials, setMaterials] = useState([])
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg")
  const [units, setUnits] = useState([])
  const [error, setError] = useState("")
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [showStockOutModal, setShowStockOutModal] = useState(false)
  const [showClearInventoryModal, setShowClearInventoryModal] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", quantity: "", unit: "" })
  const [inventorySort, setInventorySort] = useState("alpha_asc")
  const [inventoryQuery, setInventoryQuery] = useState("")

  // Load initial data
  useEffect(() => {
    fetchMaterials()
    fetchUnits()
    fetchPurchaseOrders()
  }, [])

  // Fetch functions
  const fetchMaterials = async () => {
    try {
      const res = await api.get("/inventory/rawmaterials/")
      setMaterials(res.data)
    } catch (err) {
      console.error("Error fetching materials:", err)
      setError("Failed to fetch materials. Please login first.")
    }
  }

  const fetchUnits = async () => {
    try {
      const res = await api.get("/inventory/units/")
      setUnits(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const res = await api.get("/inventory/purchase-orders/")
      setPurchaseOrders(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  // Raw material actions

  const handleAddMaterial = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/inventory/rawmaterials/", {
        name,
        quantity,
        unit,
      })
      setMaterials((prev) => [...prev, res.data])
      setName("")
      setQuantity("")
      setUnit("kg")
      setError("")
    } catch (err) {
      console.error(err)
      const nameErr = Array.isArray(err.response?.data?.name) ? err.response.data.name[0] : err.response?.data?.name
      let baseDetail = err.response?.data?.detail || nameErr || err.message
      if (typeof baseDetail === "string") {
        baseDetail = baseDetail.replace(/\s*$$case-insensitive$$\.?/i, "").trim()
      }
      const duplicateMsg =
        nameErr || (typeof baseDetail === "string" && baseDetail.toLowerCase().includes("exists"))
          ? "Invalid input, material already made."
          : ""
      const finalMsg = duplicateMsg
        ? `${duplicateMsg} ${baseDetail ? `(${baseDetail})` : ""}`.trim()
        : `Could not add material. ${baseDetail}`
      setError(finalMsg)
    }
  }

  const handleDeleteMaterial = async (id) => {
    try {
      await api.delete(`/inventory/rawmaterials/${id}/`)
      setMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error(err)
      setError("Failed to delete material.")
    }
  }

  const handleEditMaterial = (material) => {
    setEditingMaterial(material.id)
    setEditForm({
      name: material.name,
      quantity: material.quantity.toString(),
      unit: material.unit,
    })
  }

  const handleUpdateMaterial = async (id) => {
    try {
      const res = await api.put(`/inventory/rawmaterials/${id}/`, editForm)
      setMaterials((prev) => prev.map((m) => (m.id === id ? res.data : m)))
      setEditingMaterial(null)
      setEditForm({ name: "", quantity: "", unit: "" })
      setError("")
    } catch (err) {
      console.error(err)
      setError(`Failed to update material: ${err.response?.data?.detail || err.message}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingMaterial(null)
    setEditForm({ name: "", quantity: "", unit: "" })
  }

  // Called after creating a new purchase order
  const handlePurchaseSuccess = (newOrder) => {
    try {
      if (newOrder) {
        setPurchaseOrders((prev) => [newOrder, ...prev])
      } else {
        fetchPurchaseOrders()
      }
      // Refresh materials list to show updated inventory
      fetchMaterials()
    } catch (error) {
      console.error("Error in handlePurchaseSuccess:", error)
      setError("Failed to update purchase orders list")
    }
  }

  // Handle purchase order list changes (e.g., when deleting)
  const handlePurchaseOrdersChange = (updatedOrders) => {
    setPurchaseOrders(updatedOrders)
  }

  const handleUnitSuccess = () => fetchUnits()

  // Handle stock out success
  const handleStockOutSuccess = (data) => {
    // Refresh materials list to show updated inventory
    fetchMaterials()
    setError("")
    // You could also show a success message here
    console.log("Stock out successful:", data)
  }

  // Handle clear inventory success
  const handleClearInventorySuccess = (data) => {
    // Clear all local state
    setMaterials([])
    setPurchaseOrders([])
    setError("")
    console.log("Inventory cleared successfully:", data)
  }

  const sortedMaterials = [...(materials || [])].sort((a, b) => {
    switch (inventorySort) {
      case "alpha_asc":
        return (a.name || "").localeCompare(b.name || "")
      case "alpha_desc":
        return (b.name || "").localeCompare(a.name || "")
      case "time_desc":
        return (
          (new Date(b.created_at || 0).getTime() || b.id || 0) - (new Date(a.created_at || 0).getTime() || a.id || 0)
        )
      case "time_asc":
        return (
          (new Date(a.created_at || 0).getTime() || a.id || 0) - (new Date(b.created_at || 0).getTime() || b.id || 0)
        )
      default:
        return 0
    }
  })

  const filteredMaterials = sortedMaterials.filter((m) =>
    (m.name || "").toLowerCase().includes(inventoryQuery.trim().toLowerCase()),
  )

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-screen-2xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-xl border border-yellow-200">
                  <Package className="text-yellow-600" size={32} />
                </div>
                Inventory Management
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your raw materials, stock levels, and purchase orders with precision
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="bg-green-50 hover:bg-green-100 text-green-700 font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-green-200"
              >
                <ShoppingCart size={18} />
                Purchase Order
              </button>
              <button
                onClick={() => setShowStockOutModal(true)}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-red-200"
              >
                <Minus size={18} />
                Stock Out
              </button>
              <button
                onClick={() => setShowUnitModal(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-blue-200"
              >
                <Settings size={18} />
                Manage Units
              </button>
              <button
                onClick={() => setShowClearInventoryModal(true)}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-red-200"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}
          {/*}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg border border-yellow-200">
                <Plus className="text-yellow-600" size={24} />
              </div>
              Add Raw Material
            </h2>
            <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Material Name</label>
                <input
                  type="text"
                  placeholder="Enter material name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <div className="flex gap-3">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                  >
                    {units &&
                      units.map((u) => (
                        <option key={u.id} value={u.abbreviation}>
                          {u.abbreviation}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
*/}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Current Inventory */}
            <div className="flex flex-col">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                        <Package className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Current Inventory</h2>
                        {materials?.length > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 mt-1">
                            {materials.length} items
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={inventoryQuery}
                      onChange={(e) => setInventoryQuery(e.target.value)}
                      placeholder="Search materials..."
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <select
                      value={inventorySort}
                      onChange={(e) => setInventorySort(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="alpha_asc">A - Z</option>
                      <option value="alpha_desc">Z - A</option>
                      <option value="time_desc">Newest</option>
                      <option value="time_asc">Oldest</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto max-h-96">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Material</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Qty</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Unit</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredMaterials &&
                            filteredMaterials.map((mat) => (
                              <tr key={mat.id} className="hover:bg-gray-50 transition-all duration-200">
                                <td className="px-6 py-4">
                                  {editingMaterial === mat.id ? (
                                    <input
                                      type="text"
                                      value={editForm.name}
                                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="font-medium text-gray-900">{mat.name}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {editingMaterial === mat.id ? (
                                    <input
                                      type="number"
                                      value={editForm.quantity}
                                      onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                      step="0.001"
                                      min="0"
                                    />
                                  ) : (
                                    <span className="text-gray-700 font-mono">
                                      {mat.quantity ?? mat.stock?.quantity ?? 0}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {editingMaterial === mat.id ? (
                                    <select
                                      value={editForm.unit}
                                      onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    >
                                      {units &&
                                        units.map((u) => (
                                          <option key={u.id} value={u.abbreviation}>
                                            {u.abbreviation}
                                          </option>
                                        ))}
                                    </select>
                                  ) : (
                                    <span className="text-gray-500 font-mono text-xs bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                      {mat.unit}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {editingMaterial === mat.id ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleUpdateMaterial(mat.id)}
                                        className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 border border-green-200"
                                      >
                                        <Save size={12} />
                                        Save
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 border border-gray-200"
                                      >
                                        <X size={12} />
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditMaterial(mat)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 border border-blue-200"
                                      >
                                        <Edit3 size={12} />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMaterial(mat.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 border border-red-200"
                                      >
                                        <Trash2 size={12} />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {materials.length === 0 && !error && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-gray-200">
                          <Package size={32} className="text-gray-400" />
                        </div>
                        <p className="font-medium mb-2 text-gray-700">No materials found</p>
                        <p className="text-sm">Add your first raw material to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Orders */}
            <div className="flex flex-col">
              <PurchaseOrderList purchaseOrders={purchaseOrders} onPurchaseOrdersChange={handlePurchaseOrdersChange} />
            </div>

            {/* Stock History */}
            <div className="flex flex-col">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg border border-purple-200">
                      <History className="text-purple-600" size={24} />
                    </div>
                    Stock History
                  </h2>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto p-6">
                    <StockHistory />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
          <PurchaseOrderModal
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
            onSuccess={handlePurchaseSuccess}
          />

          <StockOutModal
            isOpen={showStockOutModal}
            onClose={() => setShowStockOutModal(false)}
            onSuccess={handleStockOutSuccess}
          />

          <UnitManagementModal
            isOpen={showUnitModal}
            onClose={() => setShowUnitModal(false)}
            onSuccess={handleUnitSuccess}
          />

          <ClearInventoryModal
            isOpen={showClearInventoryModal}
            onClose={() => setShowClearInventoryModal(false)}
            onSuccess={handleClearInventorySuccess}
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}
