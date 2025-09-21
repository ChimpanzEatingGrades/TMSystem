"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import api from "../../api"

const ClearInventoryModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmationText, setConfirmationText] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (confirmationText.toLowerCase() !== "clear all") {
        throw new Error('Please type "CLEAR ALL" to confirm')
      }

      const res = await api.post("/inventory/rawmaterials/clear_all/")

      // Reset form
      setConfirmationText("")

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
      console.error("Error clearing inventory:", err)
      setError(err.response?.data?.error || err.message || "Failed to clear inventory data")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle size={24} />
            Clear All Inventory Data
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-2">Warning: This action cannot be undone!</h3>
                <div className="text-sm text-red-700">
                  <p className="mb-2">This will permanently delete:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      All raw materials
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      All purchase orders
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      All stock transactions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      All recipes and recipe items
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      All menu items and categories
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      All inventory history
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600 bg-red-100 px-1 rounded">CLEAR ALL</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                disabled={loading}
                placeholder="Type CLEAR ALL to confirm"
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
                disabled={loading || confirmationText.toLowerCase() !== "clear all"}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Clear All Data
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

export default ClearInventoryModal
