"use client"

import { useState, useEffect } from "react"
import { X, Tag } from "lucide-react"
import { createCategory, updateCategory } from "../../api/inventoryAPI"

export default function CategoryModal({ onClose, onSave, editingCategory }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name || "")
      setDescription(editingCategory.description || "")
    } else {
      setName("")
      setDescription("")
    }
  }, [editingCategory])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Category name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = { name: name.trim(), description: description.trim() }

      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, payload)
      } else {
        await createCategory(payload)
      }

      onSave()
    } catch (err) {
      console.error("Failed to save category", err)
      setError("Failed to save category. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Tag size={20} />
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError("")
              }}
              placeholder="Enter category name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter category description (optional)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Saving...
                </>
              ) : (
                <>Save Category</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
