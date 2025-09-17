"use client"
import { useState, useEffect } from "react"
import api from "../api"   // this already injects Bearer token
import PurchaseOrderModal from "../components/PurchaseOrderModal"
import UnitManagementModal from "../components/UnitManagementModal"
import PurchaseOrderList from "../components/PurchaseOrderList"

export default function Inventory() {
  const [materials, setMaterials] = useState([])
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg") // default unit
  const [error, setError] = useState("")
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [units, setUnits] = useState([])
 /*}const [debugInfo, setDebugInfo] = useState("")*/

  // Load materials and units on mount
  useEffect(() => {
    fetchMaterials()
    fetchUnits()
  }, [])

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/inventory/rawmaterials/") // token auto-included
      setMaterials(res.data)
    } catch (err) {
      console.error("Failed to fetch materials", err)
      setError("Could not fetch materials. Please login first.")
    }
  }

  const fetchUnits = async () => {
    try {
      console.log("Fetching units...")
      const res = await api.get("/inventory/units/")
      console.log("Units response:", res.data)
      setUnits(res.data)
      setDebugInfo(`Units loaded: ${res.data.length} units`)
    } catch (err) {
      console.error("Failed to fetch units", err)
      setDebugInfo(`Units error: ${err.message}`)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/inventory/rawmaterials/", {
        name,
        quantity,
        unit,
      })
      setMaterials([...materials, res.data]) // update instantly
      setName("")
      setQuantity("")
      setUnit("kg")
      setError("")
    } catch (err) {
      console.error("Failed to add material", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      setError(`Could not add material. ${err.response?.data?.detail || err.message || "Please check if you're logged in."}`)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/rawmaterials/${id}/`)
      setMaterials(materials.filter((m) => m.id !== id))
    } catch (err) {
      console.error("Delete failed", err)
      setError("Could not delete material.")
    }
  }

  const handlePurchaseSuccess = () => {
    // Refresh materials after purchase order is created
    fetchMaterials()
  }

  const handleUnitSuccess = () => {
    // Refresh units after unit management
    fetchUnits()
  }

 /* const testAuth = () => {
    const token = localStorage.getItem('access')
    if (token) {
      setDebugInfo(`Token found: ${token.substring(0, 20)}...`)
    } else {
      setDebugInfo('No token found - user not logged in')
    }
  }

  const testBackend = async () => {
    try {
      const response = await api.post('/inventory/purchase-orders/test/', { test: 'data' })
      setDebugInfo(`Backend test successful: ${response.data.message}`)
    } catch (err) {
      setDebugInfo(`Backend test failed: ${err.message}`)
    }
  }*/

  return (
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
         {/* <button
            onClick={testAuth}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Test Auth
          </button>
          <button
            onClick={testBackend}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
          >
            Test Backend
          </button>*/}
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Debug Info */}
      {/*debugInfo && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <strong>Debug:</strong> {debugInfo}
        </div>
      )/*}

      {/* Add Material Form */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Raw Material</h2>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
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
            {units.map((u) => (
              <option key={u.id} value={u.abbreviation}>
                {u.abbreviation}
              </option>
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
              {materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-gray-50">
                  <td className="p-3 border border-gray-300">{mat.name}</td>
                  <td className="p-3 border border-gray-300">{mat.quantity}</td>
                  <td className="p-3 border border-gray-300">{mat.unit}</td>
                  <td className="p-3 border border-gray-300">
                    <button
                      onClick={() => handleDelete(mat.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
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
      <PurchaseOrderList />

      {/* Modals */}
      <PurchaseOrderModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={handlePurchaseSuccess}
      />

      <UnitManagementModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSuccess={handleUnitSuccess}
      />
    </div>
  )
}
