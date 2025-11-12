"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "../../api"

const ClearInventoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmationText, setConfirmationText] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (!isConfirmed) {
      setError("Please confirm you understand this action cannot be undone")
      return
    }
    
    if (confirmationText.toLowerCase() !== "clear all") {
      setError('Please type "CLEAR ALL" to confirm')
      return
    }

    setLoading(true)

    try {
      const res = await api.post("/inventory/rawmaterials/clear_all/")
      
      // Reset form
      setConfirmationText("")
      setIsConfirmed(false)
      
      // Show success toast
      toast.success("Inventory cleared successfully")

      // Close modal
      onClose()

      // Trigger success callback
      if (onSuccess) onSuccess(res.data)
      
    } catch (err) {
      console.error("Error clearing inventory:", err)
      const errorMsg = err.response?.data?.error || err.message || "Failed to clear inventory data"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Clear All Inventory</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning Content */}
        <div className="p-6 space-y-6">
          <div className="p-4 space-y-3 text-sm bg-red-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-800">This action cannot be undone</h3>
                <p className="mt-1 text-red-700">This will permanently delete all inventory data including:</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-7">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-sm text-red-700">Raw Materials</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-sm text-red-700">Purchase Orders</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-sm text-red-700">Stock History</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-sm text-red-700">Recipes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-sm text-red-700">Menu Items</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-sm text-red-700">Categories</span>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 p-3 -mx-2 bg-amber-50 rounded-lg">
            <div className="flex items-center h-5">
              <input
                id="confirmation-checkbox"
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                disabled={loading}
              />
            </div>
            <label htmlFor="confirmation-checkbox" className="text-sm text-amber-800">
              I understand this action will permanently delete all inventory data and cannot be undone.
            </label>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirmation-text" className="block text-sm font-medium text-gray-700">
              Type <span className="font-semibold text-red-600">CLEAR ALL</span> to confirm:
            </label>
            <input
              id="confirmation-text"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
              placeholder="Type CLEAR ALL to confirm"
              disabled={!isConfirmed || loading}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !isConfirmed || confirmationText.toLowerCase() !== 'clear all'}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center space-x-2 ${
                (loading || !isConfirmed || confirmationText.toLowerCase() !== 'clear all') ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Clear All Data</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClearInventoryModal
