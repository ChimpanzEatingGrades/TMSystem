import React, { useState, useEffect, useMemo } from 'react'
import api from '../api'

const StockOutModal = ({ isOpen, onClose, onSuccess, selectedBranch }) => {
  const [materials, setMaterials] = useState([])
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expiredBatches, setExpiredBatches] = useState([])
  const [forceExpired, setForceExpired] = useState(false)

  useEffect(() => {
    if (isOpen && selectedBranch) {
      fetchAvailableMaterials()
    }
  }, [isOpen, selectedBranch])

  const fetchAvailableMaterials = async () => {
    try {
      const url = selectedBranch 
        ? `/inventory/stock-out/available_materials/?branch_id=${selectedBranch}`
        : '/inventory/stock-out/available_materials/'
      const res = await api.get(url)
      setMaterials(res.data)
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError('Failed to fetch available materials')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setExpiredBatches([])
    setLoading(true)

    try {
      if (!selectedMaterial || !quantity) {
        throw new Error('Please select a material and enter quantity')
      }

      const payload = {
        raw_material_id: parseInt(selectedMaterial),
        quantity: parseFloat(quantity),
        notes: notes.trim() || undefined,
        force_expired: forceExpired
      }
      
      if (selectedBranch) {
        payload.branch_id = selectedBranch
      }
      
      const res = await api.post('/inventory/stock-out/stock_out/', payload)

      console.log('Stock out response:', res.data)

      // Dispatch refresh event IMMEDIATELY to update alerts
      console.log('Dispatching refreshInventory event')
      window.dispatchEvent(new CustomEvent('refreshInventory'))

      // Reset form
      setSelectedMaterial('')
      setQuantity('')
      setNotes('')
      setForceExpired(false)
      
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
      console.error('Stock out error:', err)
      
      // Check if this is an insufficient stock error
      if (err.response?.status === 400 && err.response?.data) {
        const errorData = err.response.data
        
        // Handle insufficient stock with expired batches info
        if (errorData.expired_batches) {
          setExpiredBatches(errorData.expired_batches)
          setError(
            errorData.error + 
            (errorData.expired_batches.length > 0 
              ? `\n\n${errorData.suggestion || 'There are expired batches available for disposal.'}`
              : ''
            )
          )
        } else {
          setError(errorData.error || 'Insufficient stock for this operation')
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to process stock out')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedMaterialData = materials.find(m => m.id.toString() === selectedMaterial)

  const totalExpiredQuantity = useMemo(() => 
    expiredBatches.reduce((sum, batch) => sum + parseFloat(batch.quantity), 0),
    [expiredBatches]
  );

  const maxAllowedQuantity = forceExpired && totalExpiredQuantity > 0 
    ? totalExpiredQuantity 
    : selectedMaterialData?.quantity;

  const isQuantityInvalid = 
    selectedMaterialData && 
    quantity && 
    maxAllowedQuantity !== undefined &&
    parseFloat(quantity) > maxAllowedQuantity;

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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

        {!selectedBranch && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            ⚠️ Please select a branch from the inventory page before performing stock out.
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="whitespace-pre-line">{error}</p>
            {expiredBatches.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-sm">Expired Batches:</p>
                <ul className="text-xs mt-1 space-y-1">
                  {expiredBatches.map((batch, idx) => (
                    <li key={idx}>
                      Batch #{batch.batch_id}: {batch.quantity} units (expired {batch.expiry_date})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Material *
            </label>
            <select
              value={selectedMaterial}
              onChange={(e) => {
                setSelectedMaterial(e.target.value)
                setError('')
                setExpiredBatches([])
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="">Choose a material...</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.quantity} {material.unit} available)
                </option>
              ))}
            </select>
          </div>

          {selectedMaterialData && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Available Stock:</strong> {selectedMaterialData.quantity} {selectedMaterialData.unit}
              </p>
              {selectedMaterialData.expired_batches_count > 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ {selectedMaterialData.expired_batches_count} expired batch(es) available
                </p>
              )}
              {selectedMaterialData.expiring_soon_count > 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  ⏰ {selectedMaterialData.expiring_soon_count} batch(es) expiring soon
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value)
                setError('')
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.001"
              min="0.001"
              max={maxAllowedQuantity ?? undefined}
              required
              disabled={loading}
              placeholder="Enter quantity to remove"
            />
            {isQuantityInvalid && (
              <p className="text-sm text-red-600 mt-1">
                Cannot exceed available stock ({maxAllowedQuantity} {selectedMaterialData.unit})
              </p>
            )}
          </div>

          {expiredBatches.length > 0 && (
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={forceExpired}
                  onChange={(e) => setForceExpired(e.target.checked)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  Stock out expired batches for disposal
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Enable this to remove expired inventory from stock
              </p>
            </div>
          )}

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
              className={`px-4 py-2 ${forceExpired ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded disabled:opacity-50`}
              disabled={loading || !selectedMaterial || !quantity || isQuantityInvalid}
            >
              {loading ? 'Processing...' : forceExpired ? 'Stock Out Expired' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockOutModal
