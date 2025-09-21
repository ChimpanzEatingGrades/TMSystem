import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../api'
import { ACCESS_TOKEN } from '../constants'

const StockOutModal = ({ isOpen, onClose, onSuccess }) => {
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMaterials()
    }
  }, [isOpen])

  const fetchAvailableMaterials = async () => {
    try {
      const res = await api.get('/inventory/stock-out/available_materials/')
      setMaterials(res.data)
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError('Failed to fetch available materials')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!selectedMaterial || !quantity) {
        throw new Error('Please select a material and enter quantity')
      }

      const res = await api.post('/inventory/stock-out/stock_out/', {
        raw_material_id: parseInt(selectedMaterial),
        quantity: parseFloat(quantity),
        notes: notes.trim() || undefined
      })

      // Reset form
      setSelectedMaterial('')
      setQuantity('')
      setNotes('')
      
      // Close modal first
      onClose()
      
      // Then call success callback
      if (onSuccess) {
        try {
          onSuccess(res.data)
        } catch (error) {
          console.error('Error in onSuccess callback:', error)
        }
      }
    } catch (err) {
      console.error('Error processing stock out:', err)
      setError(err.response?.data?.error || err.message || 'Failed to process stock out')
    } finally {
      setLoading(false)
    }
  }

  const selectedMaterialData = materials.find(m => m.id.toString() === selectedMaterial)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Stock Out</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Material *
            </label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Available Stock:</strong> {selectedMaterialData.quantity} {selectedMaterialData.unit}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min="0.001"
              max={selectedMaterialData?.quantity || undefined}
              required
              disabled={loading}
              placeholder="Enter quantity to remove"
            />
          </div>


          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              disabled={loading}
              placeholder="Reason for stock out, destination, etc."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={loading || !selectedMaterial || !quantity}
            >
              {loading ? 'Processing...' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockOutModal
