"use client"

import { useState, useEffect } from "react"
import menuAPI from "../lib/api"

export function MenuItemModal({ isOpen, onClose, onSave, menuItem, categories }) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    is_active: true,
    valid_from: "",
    valid_until: "",
    no_end_date: false,
    available_24_7: true,
    picture: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (message, type = "success") => {
    alert(`${type.toUpperCase()}: ${message}`)
  }

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        price: menuItem.price.toString(),
        description: menuItem.description || "",
        category_id: menuItem.category?.id?.toString() || "",
        is_active: menuItem.is_active,
        valid_from: menuItem.valid_from || "",
        valid_until: menuItem.valid_until || "",
        no_end_date: !menuItem.valid_until,
        available_24_7: true,
        picture: null,
      })
    } else {
      setFormData({
        name: "",
        price: "",
        description: "",
        category_id: "",
        is_active: true,
        valid_from: "",
        valid_until: "",
        no_end_date: false,
        available_24_7: true,
        picture: null,
      })
    }
  }, [menuItem, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = new FormData()
      submitData.append("name", formData.name)
      submitData.append("price", formData.price)
      submitData.append("description", formData.description)
      submitData.append("is_active", formData.is_active.toString())

      if (formData.category_id) {
        submitData.append("category_id", formData.category_id)
      }

      if (formData.valid_from) {
        submitData.append("valid_from", formData.valid_from)
      }

      if (!formData.no_end_date && formData.valid_until) {
        submitData.append("valid_until", formData.valid_until)
      }

      if (formData.picture) {
        submitData.append("picture", formData.picture)
      }

      if (menuItem) {
        await menuAPI.updateMenuItem(menuItem.id, submitData)
      } else {
        await menuAPI.createMenuItem(submitData)
      }

      showToast(`Menu item ${menuItem ? "updated" : "created"} successfully`)
      onSave()
    } catch (error) {
      showToast("Failed to save menu item", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, picture: file }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{menuItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.category_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="picture" className="block text-sm font-medium text-gray-700 mb-1">
              Picture
            </label>
            <input
              id="picture"
              type="file"
              accept="image/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">🕐 Availability Hours</h3>
            <div className="flex items-center space-x-2">
              <input
                id="available_24_7"
                type="checkbox"
                className="rounded"
                checked={formData.available_24_7}
                onChange={(e) => setFormData((prev) => ({ ...prev, available_24_7: e.target.checked }))}
              />
              <label htmlFor="available_24_7" className="text-sm font-medium text-gray-700">
                Available 24/7
              </label>
            </div>
            {!formData.available_24_7 && (
              <div className="text-sm text-gray-500">Custom hour selection will be implemented in future updates</div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">📅 Valid Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  id="valid_from"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.valid_from}
                  onChange={(e) => setFormData((prev) => ({ ...prev, valid_from: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  id="valid_until"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  value={formData.valid_until}
                  onChange={(e) => setFormData((prev) => ({ ...prev, valid_until: e.target.value }))}
                  disabled={formData.no_end_date}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="no_end_date"
                type="checkbox"
                className="rounded"
                checked={formData.no_end_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    no_end_date: e.target.checked,
                    valid_until: e.target.checked ? "" : prev.valid_until,
                  }))
                }
              />
              <label htmlFor="no_end_date" className="text-sm font-medium text-gray-700">
                No end date
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is_active"
              type="checkbox"
              className="rounded"
              checked={formData.is_active}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : menuItem ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
