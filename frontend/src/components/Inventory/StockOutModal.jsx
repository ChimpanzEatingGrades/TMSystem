"use client"

import { useState, useEffect } from "react"
import { Minus, Package, AlertTriangle, X } from "lucide-react"
import api from "../../api"

const StockOutModal = ({ isOpen, onClose, onSuccess }) => {
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMaterials()
    }
  }, [isOpen])

  const fetchAvailableMaterials = async () => {
    try {
      const res = await api.get("/inventory/stock-out/available_materials/")
      setMaterials(res.data)
    } catch (err) {
      console.error("Error fetching materials:", err)
      setError("Failed to fetch available materials")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!selectedMaterial || !quantity) {
        throw new Error("Please select a material and enter quantity")
      }

      console.log('=== STOCK OUT REQUEST ===')
      console.log('Material ID:', selectedMaterial)
      console.log('Quantity:', quantity)
      console.log('Notes:', notes)

      const payload = {
        raw_material_id: Number.parseInt(selectedMaterial),
        quantity: Number.parseFloat(quantity),
        notes: notes.trim() || undefined,
      }
      
      console.log('Sending payload:', payload)

      const res = await api.post("/inventory/stock-out/stock_out/", payload)

      console.log('Stock out response:', res.data)

      // Reset form
      setSelectedMaterial("")
      setQuantity("")
      setNotes("")

      // Close modal first
      onClose()

      // Then call success callback
      if (onSuccess) {
        try {
          onSuccess(res.data)
        } catch (error) {
          console.error("Error in onSuccess callback:", error)
        }
      }
    } catch (err) {
      console.error("=== STOCK OUT ERROR ===")
      console.error("Error:", err)
      console.error("Error response:", err.response?.data)
      console.error("Error status:", err.response?.status)
      
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          err.message || 
                          "Failed to process stock out"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const selectedMaterialData = materials.find((m) => m.id.toString() === selectedMaterial)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Minus className="text-red-500" size={24} />
            Stock Out
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Material *</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Choose a material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.quantity} {material.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterialData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Package size={16} />
                  <span className="font-medium">Available Stock:</span>
                  <span className="font-semibold">
                    {selectedMaterialData.quantity} {selectedMaterialData.unit}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                step="0.001"
                min="0.001"
                max={selectedMaterialData?.quantity || undefined}
                required
                disabled={loading}
                placeholder="Enter quantity to remove"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                disabled={loading}
                placeholder="Reason for stock out, destination, etc."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                disabled={loading || !selectedMaterial || !quantity}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Minus size={16} />
                    Stock Out
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StockOutModal
