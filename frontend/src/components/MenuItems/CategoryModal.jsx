"use client"

import { useState, useEffect } from "react"

export default function CategoryModal({ onClose, onSave, editingCategory }) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setName(editingCategory?.name || "")
  }, [editingCategory])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await onSave({ name })
      onClose()
    } catch (err) {
      setError("Failed to save category")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-bold mb-4">{editingCategory ? "Edit Category" : "Add Category"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-[#FFC601] font-semibold">
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
