"use client"
import { useState, useEffect } from "react"
import api from "../api"
import Navbar from "../components/Navbar"
import PurchaseOrderModal from "../components/PurchaseOrderModal"
import UnitManagementModal from "../components/UnitManagementModal"
import PurchaseOrderList from "../components/PurchaseOrderList"
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
      setMaterials(res.data)
    } catch (err) {
      console.error('Error fetching materials:', err)
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
      setMaterials(prev => [...prev, res.data])
      setName("")
      setQuantity("")
      setUnit("kg")
      setError("")
    } catch (err) {
      console.error(err)
      setError(
        `Could not add material. ${err.response?.data?.detail || err.message}`
      )
    }
  }

  const handleDeleteMaterial = async (id) => {
    try {
      await api.delete(`/inventory/rawmaterials/${id}/`)
      setMaterials(prev => prev.filter(m => m.id !== id))
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
      unit: material.unit
    })
  }

  const handleUpdateMaterial = async (id) => {
    try {
      const res = await api.put(`/inventory/rawmaterials/${id}/`, editForm)
      setMaterials(prev => prev.map(m => m.id === id ? res.data : m))
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
        setPurchaseOrders(prev => [newOrder, ...prev])
      } else {
        fetchPurchaseOrders()
      }
      // Refresh materials list to show updated inventory
      fetchMaterials()
    } catch (error) {
      console.error('Error in handlePurchaseSuccess:', error)
      setError('Failed to update purchase orders list')
    }
  }

  // Handle purchase order list changes (e.g., when deleting)
  const handlePurchaseOrdersChange = (updatedOrders) => {
    setPurchaseOrders(updatedOrders)
  }

  const handleUnitSuccess = () => fetchUnits()


  return (
    <ErrorBoundary>
      <div>
        <Navbar />
        <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Create Purchase Order
            </button>
            <button
              onClick={() => setShowUnitModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Manage Units
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Add Material */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Raw Material</h2>
          <form onSubmit={handleAddMaterial} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Material Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border p-2 rounded-md"
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-32 border p-2 rounded-md"
              step="0.01"
              min="0"
              required
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-32 border p-2 rounded-md"
            >
              {units && units.map(u => (
                <option key={u.id} value={u.abbreviation}>{u.abbreviation}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-[#FFC601] hover:bg-yellow-500 text-black px-4 py-2 rounded-md"
            >
              Add Material
            </button>
          </form>
        </div>

        {/* Materials Table */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border border-gray-300 text-left">Name</th>
                  <th className="p-3 border border-gray-300 text-left">Quantity</th>
                  <th className="p-3 border border-gray-300 text-left">Unit</th>
                  <th className="p-3 border border-gray-300 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials && materials.map(mat => (
                  <tr key={mat.id} className="hover:bg-gray-50">
                    <td className="p-3 border border-gray-300">
                      {editingMaterial === mat.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        mat.name
                      )}
                    </td>
                    <td className="p-3 border border-gray-300">
                      {editingMaterial === mat.id ? (
                        <input
                          type="number"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                          step="0.001"
                          min="0"
                        />
                      ) : (
                        mat.quantity ?? mat.stock?.quantity ?? 0
                      )}
                    </td>
                    <td className="p-3 border border-gray-300">
                      {editingMaterial === mat.id ? (
                        <select
                          value={editForm.unit}
                          onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        >
                          {units && units.map(u => (
                            <option key={u.id} value={u.abbreviation}>{u.abbreviation}</option>
                          ))}
                        </select>
                      ) : (
                        mat.unit
                      )}
                    </td>
                    <td className="p-3 border border-gray-300">
                      {editingMaterial === mat.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateMaterial(mat.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditMaterial(mat)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
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
            <p className="text-center mt-4 text-gray-500">No materials found.</p>
          )}
        </div>

        {/* Purchase Orders */}
        <PurchaseOrderList 
          purchaseOrders={purchaseOrders} 
          onPurchaseOrdersChange={handlePurchaseOrdersChange}
        />

        {/* Modals */}
        <PurchaseOrderModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess} // returns new PO
        />

        <UnitManagementModal
          isOpen={showUnitModal}
          onClose={() => setShowUnitModal(false)}
          onSuccess={handleUnitSuccess}
        />
        </div>
      </div>
    </ErrorBoundary>
  )
}
