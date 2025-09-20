import React, { useState } from 'react'
import api from '../api'

const ClearInventoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationText, setConfirmationText] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (confirmationText.toLowerCase() !== 'clear all') {
        throw new Error('Please type "CLEAR ALL" to confirm')
      }

      const res = await api.post('/inventory/rawmaterials/clear_all/')
      
      // Reset form
      setConfirmationText('')
      
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
      console.error('Error clearing inventory:', err)
      setError(err.response?.data?.error || err.message || 'Failed to clear inventory data')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-red-600">Clear All Inventory Data</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Warning: This action cannot be undone!
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>All raw materials</li>
                    <li>All purchase orders</li>
                    <li>All stock transactions</li>
                    <li>All recipes and recipe items</li>
                    <li>All menu items and categories</li>
                    <li>All inventory history</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">CLEAR ALL</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={loading}
              placeholder="Type CLEAR ALL to confirm"
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
              disabled={loading || confirmationText.toLowerCase() !== 'clear all'}
            >
              {loading ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClearInventoryModal
