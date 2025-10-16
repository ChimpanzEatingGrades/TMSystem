"use client"
import { useState, useEffect } from "react"
import {
  Package,
  ShoppingCart,
  Minus,
  History,
  Settings,
  Trash2,
  Edit3,
  Save,
  X,
  AlertTriangle,
  RefreshCw,
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
  // State
  const [materials, setMaterials] = useState([])
  const [units, setUnits] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [error, setError] = useState("")
  const [inventorySort, setInventorySort] = useState("alpha_asc")
  const [inventoryQuery, setInventoryQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Modal states
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [showStockOutModal, setShowStockOutModal] = useState(false)
  const [showClearInventoryModal, setShowClearInventoryModal] = useState(false)
  
  // Edit state
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editForm, setEditForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    material_type: "raw",
    minimum_threshold: "",
    reorder_level: "",
    shelf_life_days: ""
  })

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

  // Edit handlers
  const handleEditMaterial = (material) => {
    setEditingMaterial(material.id)
    setEditForm({
      name: material.name,
      quantity: material.quantity.toString(),
      unit: material.unit,
      material_type: material.material_type || 'raw',
      minimum_threshold: material.minimum_threshold?.toString() || '10',
      reorder_level: material.reorder_level?.toString() || '20',
      shelf_life_days: material.shelf_life_days?.toString() || '7',
    })
  }

  const handleUpdateMaterial = async (id) => {
    if (saving) return
    
    try {
      setSaving(true)
      
      const updateData = {
        name: editForm.name,
        quantity: parseFloat(editForm.quantity),
        unit: editForm.unit,
        material_type: editForm.material_type,
        minimum_threshold: parseFloat(editForm.minimum_threshold),
        reorder_level: parseFloat(editForm.reorder_level),
      }
      
      // Only add shelf_life_days if material is NOT supplies
      if (editForm.material_type !== 'supplies') {
        updateData.shelf_life_days = parseInt(editForm.shelf_life_days)
      }
      
      const res = await api.put(`/inventory/rawmaterials/${id}/`, updateData)
      
      setEditingMaterial(null)
      setEditForm({
        name: "",
        quantity: "",
        unit: "",
        material_type: "raw",
        minimum_threshold: "",
        reorder_level: "",
        shelf_life_days: ""
      })
      setError("")
      
      setMaterials((prev) => prev.map((m) => (m.id === id ? res.data : m)))
    } catch (err) {
      console.error('Update error:', err)
      setError(`Failed to update material: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingMaterial(null)
    setEditForm({
      name: "",
      quantity: "",
      unit: "",
      material_type: "raw",
      minimum_threshold: "",
      reorder_level: "",
      shelf_life_days: ""
    })
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

  // Success handlers
  const handlePurchaseSuccess = (newOrder) => {
    try {
      if (newOrder) {
        setPurchaseOrders((prev) => [newOrder, ...prev])
      } else {
        fetchPurchaseOrders()
      }
      fetchMaterials()
    } catch (error) {
      console.error("Error in handlePurchaseSuccess:", error)
      setError("Failed to update purchase orders list")
    }
  }

  const handlePurchaseOrdersChange = (updatedOrders) => {
    setPurchaseOrders(updatedOrders)
  }

  const handleUnitSuccess = () => fetchUnits()

  const handleStockOutSuccess = (data) => {
    fetchMaterials()
    setError("")
  }

  const handleClearInventorySuccess = (data) => {
    setMaterials([])
    setPurchaseOrders([])
    setError("")
  }

  const handleRefreshInventory = async () => {
    setRefreshing(true)
    try {
      await fetchMaterials()
    } catch (error) {
      console.error("Error refreshing inventory:", error)
      setError("Failed to refresh inventory")
    } finally {
      setRefreshing(false)
    }
  }

  // Sorting and filtering
  const sortedMaterials = [...(materials || [])].sort((a, b) => {
    switch (inventorySort) {
      case "alpha_asc":
        return (a.name || "").localeCompare(b.name || "")
      case "alpha_desc":
        return (b.name || "").localeCompare(a.name || "")
      case "time_desc":
        return (new Date(b.created_at || 0).getTime() || b.id || 0) - (new Date(a.created_at || 0).getTime() || a.id || 0)
      case "time_asc":
        return (new Date(a.created_at || 0).getTime() || a.id || 0) - (new Date(b.created_at || 0).getTime() || b.id || 0)
      default:
        return 0
    }
  })

  const filteredMaterials = sortedMaterials.filter((m) =>
    (m.name || "").toLowerCase().includes(inventoryQuery.trim().toLowerCase())
  )

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-full mx-auto px-6 py-8">
          {/* Header */}
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

          {/* Threshold Information Panel */}
      { /*   <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={18} />
              Stock Threshold Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div>
                <span className="font-medium">Minimum Threshold:</span>
                <p className="text-xs mt-1">When stock reaches this level, you'll get a "Low Stock" alert.</p>
              </div>
              <div>
                <span className="font-medium">Reorder Level:</span>
                <p className="text-xs mt-1">When stock reaches this level, you'll get a "Reorder" alert.</p>
              </div>
              <div>
                <span className="font-medium">Formula:</span>
                <p className="text-xs mt-1">Min Threshold = (Daily Usage × Lead Time) + Buffer</p>
              </div>
            </div>
          </div>*/}

          {/* Current Inventory */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
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

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inventoryQuery}
                    onChange={(e) => setInventoryQuery(e.target.value)}
                    placeholder="Search materials..."
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={inventorySort}
                    onChange={(e) => setInventorySort(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="alpha_asc">A - Z</option>
                    <option value="alpha_desc">Z - A</option>
                    <option value="time_desc">Newest</option>
                    <option value="time_asc">Oldest</option>
                  </select>
                  <button
                    onClick={handleRefreshInventory}
                    disabled={refreshing}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-blue-200 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Material</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Unit</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Shelf Life</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMaterials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4">
                        {editingMaterial === mat.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                          <select
                            value={editForm.material_type}
                            onChange={(e) => {
                              const newType = e.target.value
                              setEditForm((prev) => {
                                if (newType === 'supplies') {
                                  return { ...prev, material_type: newType, shelf_life_days: '' }
                                } else if (prev.material_type === 'supplies') {
                                  const defaultShelfLife = newType === 'raw' ? '7' : newType === 'processed' ? '180' : '14'
                                  return { ...prev, material_type: newType, shelf_life_days: defaultShelfLife }
                                }
                                return { ...prev, material_type: newType }
                              })
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="raw">Raw Material</option>
                            <option value="processed">Processed Good</option>
                            <option value="semi_processed">Semi-Processed</option>
                            <option value="supplies">Supplies & Utensils</option>
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            mat.material_type === 'raw' ? 'bg-green-100 text-green-800' :
                            mat.material_type === 'processed' ? 'bg-blue-100 text-blue-800' :
                            mat.material_type === 'supplies' ? 'bg-gray-100 text-gray-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {mat.material_type_display || 'Raw Material'}
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {editingMaterial === mat.id ? (
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            step="0.001"
                            min="0"
                          />
                        ) : (
                          <span className="text-gray-700 font-mono">{mat.quantity}</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {editingMaterial === mat.id ? (
                          <select
                            value={editForm.unit}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.abbreviation}>{u.abbreviation}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-500 font-mono text-xs bg-gray-100 px-3 py-1 rounded-full">{mat.unit}</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {editingMaterial === mat.id ? (
                          mat.material_type === 'supplies' || editForm.material_type === 'supplies' ? (
                            <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500 italic">
                              N/A (Non-perishable)
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={editForm.shelf_life_days}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, shelf_life_days: e.target.value }))}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                              min="1"
                            />
                          )
                        ) : (
                          <span className="text-sm text-gray-700">
                            {mat.material_type === 'supplies' ? 'N/A (Non-perishable)' : `${mat.shelf_life_days || 7} days`}
                          </span>
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
                              disabled={saving}
                              className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 border border-green-200 disabled:opacity-50"
                            >
                              <Save size={12} />
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 border border-gray-200 disabled:opacity-50"
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
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Package size={32} className="text-gray-400" />
                </div>
                <p className="font-medium mb-2 text-gray-700">No materials found</p>
                <p className="text-sm">Add your first raw material to get started</p>
              </div>
            )}
          </div>

          {/* Purchase Orders */}
          <div className="mb-8">
            <PurchaseOrderList purchaseOrders={purchaseOrders} onPurchaseOrdersChange={handlePurchaseOrdersChange} />
          </div>

          {/* Stock History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg border border-purple-200">
                  <History className="text-purple-600" size={24} />
                </div>
                Stock History
              </h2>
            </div>
            <div className="p-6">
              <StockHistory />
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
