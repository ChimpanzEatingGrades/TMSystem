"use client"

import { useState, useEffect } from "react"
import { X, Upload, Calendar, Clock, Tag, ImageIcon } from "lucide-react"
import { createMenuItem, updateMenuItem, getCategories } from "../../api/inventoryAPI"
import RecipeModal from "./RecipeModal"

export default function MenuItemModal({ onClose, onSave, editingItem }) {
  const [categories, setCategories] = useState([])
  const [imagePreview, setImagePreview] = useState(editingItem?.picture || null)
  const [showRecipe, setShowRecipe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: editingItem?.name || "",
    description: editingItem?.description || "",
    price: editingItem?.price || "",
    valid_from: editingItem?.valid_from || "",
    valid_until: editingItem?.valid_until || "",
    no_end_date: !editingItem?.valid_until,
    available_from: editingItem?.available_from || "00:00",
    available_to: editingItem?.available_to || "23:59",
    is_active: typeof editingItem?.is_active === "boolean" ? editingItem.is_active : true,
    picture: null,
    category_id: editingItem?.category?.id || "",
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await getCategories()
      const data = res.data?.results ?? res.data
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load categories", err)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Valid price is required"
    }

    if (!formData.category_id) {
      newErrors.category_id = "Category is required"
    }

    if (formData.valid_from && formData.valid_until && !formData.no_end_date) {
      if (new Date(formData.valid_from) > new Date(formData.valid_until)) {
        newErrors.valid_until = "End date must be after start date"
      }
    }

    if (formData.available_from && formData.available_to) {
      if (formData.available_from >= formData.available_to) {
        newErrors.available_to = "Available to time must be after available from time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

    if (files && files[0]) {
      const file = files[0]
      setFormData({ ...formData, [name]: file })
      setImagePreview(URL.createObjectURL(file))
      return
    }

    if (name === "no_end_date") {
      setFormData({
        ...formData,
        [name]: checked,
        valid_until: checked ? "" : formData.valid_until,
      })
      return
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    const data = new FormData()

    Object.keys(formData).forEach((key) => {
      if (key === "no_end_date") return
      if (formData[key] !== null && formData[key] !== "") {
        data.append(key, formData[key])
      }
    })

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data)
      } else {
        await createMenuItem(data)
      }
      onSave()
    } catch (err) {
      console.error("Save failed", err)
      setErrors({ submit: "Failed to save menu item. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800 text-sm">{errors.submit}</div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <Tag size={20} />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors ${
                      errors.price ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors resize-none"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors appearance-none bg-white ${
                    errors.category_id ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <ImageIcon size={20} />
                Product Image
              </h3>

              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    id="pictureUpload"
                    name="picture"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("pictureUpload").click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FFC601] hover:bg-yellow-50 transition-colors duration-200"
                  >
                    <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm text-gray-600">{imagePreview ? "Change Image" : "Click to upload image"}</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </button>
                </div>

                {imagePreview && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Availability Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <Calendar size={20} />
                Availability Settings
              </h3>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                  <input
                    type="date"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                  <input
                    type="date"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleChange}
                    disabled={formData.no_end_date}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors ${
                      formData.no_end_date ? "bg-gray-100 text-gray-400" : ""
                    } ${errors.valid_until ? "border-red-300" : ""}`}
                  />
                  {errors.valid_until && <p className="text-red-500 text-xs mt-1">{errors.valid_until}</p>}
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="no_end_date"
                  checked={formData.no_end_date}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#FFC601] border-gray-300 rounded focus:ring-[#FFC601]"
                />
                <span className="text-gray-700">No end date (available indefinitely)</span>
              </label>

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Available From
                  </label>
                  <input
                    type="time"
                    name="available_from"
                    value={formData.available_from}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Available To
                  </label>
                  <input
                    type="time"
                    name="available_to"
                    value={formData.available_to}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors ${
                      errors.available_to ? "border-red-300" : ""
                    }`}
                  />
                  {errors.available_to && <p className="text-red-500 text-xs mt-1">{errors.available_to}</p>}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_active"
                      value={true}
                      checked={formData.is_active === true}
                      onChange={(e) => setFormData({ ...formData, is_active: true })}
                      className="w-4 h-4 text-[#FFC601] border-gray-300 focus:ring-[#FFC601]"
                    />
                    <span className="text-green-700 font-medium">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_active"
                      value={false}
                      checked={formData.is_active === false}
                      onChange={(e) => setFormData({ ...formData, is_active: false })}
                      className="w-4 h-4 text-[#FFC601] border-gray-300 focus:ring-[#FFC601]"
                    />
                    <span className="text-red-700 font-medium">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Recipe Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowRecipe(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {editingItem ? "Edit Recipe & Ingredients" : "Add Recipe & Ingredients"}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Saving...
                </>
              ) : (
                <>Save Menu Item</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recipe Modal */}
      {showRecipe && (
        <RecipeModal
          onClose={() => setShowRecipe(false)}
          existingRecipe={editingItem?.recipe}
          onSave={(recipe) => {
            setFormData({ ...formData, recipe_id: recipe.id })
            setShowRecipe(false)
          }}
          menuItemId={editingItem?.id}
        />
      )}
    </div>
  )
}
