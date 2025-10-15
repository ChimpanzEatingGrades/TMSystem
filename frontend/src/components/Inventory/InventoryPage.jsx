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
import api from "../../api"
import Navbar from "../Navbar"
import PurchaseOrderModal from "./PurchaseOrderModal"
import UnitManagementModal from "./UnitManagementModal"
import PurchaseOrderList from "./PurchaseOrderList"
import StockOutModal from "./StockOutModal"
import StockHistory from "./StockHistory"
import ClearInventoryModal from "./ClearInventoryModal"
import ErrorBoundary from "./ErrorBoundary"

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
  const [showStockHistory, setShowStockHistory] = useState(false)
  const [showClearInventoryModal, setShowClearInventoryModal] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", quantity: "", unit: "" })

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
      console.log("Fetched materials:", res.data) // Debug log to check data
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-full mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
                <Package className="text-[#FFC601]" size={32} />
                Inventory Management
              </h1>
              <p className="text-gray-600">Manage your raw materials, stock levels, and purchase orders</p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <ShoppingCart size={18} />
                Purchase Order
              </button>
              <button
                onClick={() => setShowStockOutModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <Minus size={18} />
                Stock Out
              </button>
              <button
                onClick={() => setShowStockHistory(!showStockHistory)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <History size={18} />
                {showStockHistory ? "Hide" : "Show"} History
              </button>
              <button
                onClick={() => setShowUnitModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <Settings size={18} />
                Manage Units
              </button>
              <button
                onClick={() => setShowClearInventoryModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
              <Plus className="text-[#FFC601]" size={24} />
              Add Raw Material
            </h2>
            <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                <input
                  type="text"
                  placeholder="Enter material name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <div className="flex gap-2">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
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
                    className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Current Inventory - Full Width */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black flex items-center gap-2">
                <Package className="text-[#FFC601]" size={24} />
                Current Inventory
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Material Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Unit</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Expiry Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materials &&
                    materials.map((mat) => {
                      // Calculate expiry status
                      const getExpiryStatus = (expiryDate) => {
                        if (!expiryDate) return null;
                        const today = new Date();
                        const expiry = new Date(expiryDate);
                        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntilExpiry < 0) {
                          return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'Expired' };
                        } else if (daysUntilExpiry <= 7) {
                          return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800', text: `${daysUntilExpiry}d left` };
                        } else {
                          return { status: 'good', color: 'bg-green-100 text-green-800', text: 'Good' };
                        }
                      };
                      
                      const expiryStatus = getExpiryStatus(mat.expiry_date);
                      
                      // Debug log for each material
                      console.log(`Material ${mat.name}:`, {
                        id: mat.id,
                        expiry_date: mat.expiry_date,
                        expiryStatus: expiryStatus
                      });
                      
                      return (
                        <tr key={mat.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            {editingMaterial === mat.id ? (
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                              />
                            ) : (
                              <span className="font-medium text-gray-900">{mat.name}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingMaterial === mat.id ? (
                              <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                                step="0.001"
                                min="0"
                              />
                            ) : (
                              <span className="text-gray-900">{mat.quantity ?? mat.stock?.quantity ?? 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingMaterial === mat.id ? (
                              <select
                                value={editForm.unit}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                              >
                                {units &&
                                  units.map((u) => (
                                    <option key={u.id} value={u.abbreviation}>
                                      {u.abbreviation}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <span className="text-gray-600 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {mat.unit}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {mat.expiry_date ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-700">
                                  {new Date(mat.expiry_date).toLocaleDateString()}
                                </span>
                                {expiryStatus && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${expiryStatus.color} w-fit`}>
                                    {expiryStatus.text}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">No expiry date</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {mat.is_low_stock && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 w-fit">
                                  Low Stock
                                </span>
                              )}
                              {mat.quantity <= 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 w-fit">
                                  Out of Stock
                                </span>
                              )}
                              {!mat.is_low_stock && mat.quantity > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 w-fit">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingMaterial === mat.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateMaterial(mat.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                >
                                  <Save size={14} />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditMaterial(mat)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                >
                                  <Edit3 size={14} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMaterial(mat.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {materials.length === 0 && !error && (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No materials found</p>
                <p>Add your first raw material to get started</p>
              </div>
            )}
          </div>

          {/* Stock History - Full Width */}
          {showStockHistory && (
            <div className="mb-8">
              <StockHistory />
            </div>
          )}

          {/* Purchase Orders - Full Width */}
          <PurchaseOrderList purchaseOrders={purchaseOrders} onPurchaseOrdersChange={handlePurchaseOrdersChange} />

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
