"use client"

import { useState, useEffect } from "react"
import menuAPI from "../lib/api"

export function RecipeModal({ isOpen, onClose, onSave, menuItem }) {
  const [rawMaterials, setRawMaterials] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    yield_quantity: "",
    yield_uom: "",
    items: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (message, type = "success") => {
    alert(`${type.toUpperCase()}: ${message}`)
  }

  useEffect(() => {
    if (isOpen) {
      fetchRawMaterials()
    }
  }, [isOpen])

  useEffect(() => {
    if (menuItem) {
      if (menuItem.recipe) {
        setFormData({
          name: menuItem.recipe.name,
          description: menuItem.recipe.description || "",
          yield_quantity: menuItem.recipe.yield_quantity,
          yield_uom: menuItem.recipe.yield_uom || "",
          items: menuItem.recipe.items || [],
        })
      } else {
        setFormData({
          name: `${menuItem.name} Recipe`,
          description: "",
          yield_quantity: "1",
          yield_uom: "serving",
          items: [],
        })
      }
    }
  }, [menuItem, isOpen])

  const fetchRawMaterials = async () => {
    try {
      const data = await menuAPI.getRawMaterials()
      setRawMaterials(data)
    } catch (error) {
      showToast("Failed to fetch raw materials", "error")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const recipeData = {
        ...formData,
        menu_item_id: menuItem.id,
      }

      if (menuItem.recipe) {
        await menuAPI.updateRecipe(menuItem.recipe.id, recipeData)
      } else {
        await menuAPI.createRecipe(recipeData)
      }

      showToast(`Recipe ${menuItem.recipe ? "updated" : "created"} successfully`)
      onSave()
    } catch (error) {
      showToast("Failed to save recipe", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addRecipeItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { raw_material_id: "", quantity: "" }],
    }))
  }

  const removeRecipeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateRecipeItem = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {menuItem?.recipe ? "Edit Recipe" : "Create Recipe"} - {menuItem?.name}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recipe-name" className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Name *
              </label>
              <input
                id="recipe-name"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="yield-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Yield Quantity
                </label>
                <input
                  id="yield-quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.yield_quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yield_quantity: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="yield-uom" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  id="yield-uom"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.yield_uom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, yield_uom: e.target.value }))}
                  placeholder="e.g., servings, portions"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="recipe-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="recipe-description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <button
                type="button"
                onClick={addRecipeItem}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                + Add Ingredient
              </button>
            </div>

            {formData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                No ingredients added yet. Click "Add Ingredient" to get started.
              </div>
            )}

            {formData.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raw Material *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.raw_material_id?.toString() || ""}
                    onChange={(e) => updateRecipeItem(index, "raw_material_id", e.target.value)}
                  >
                    <option value="">Select raw material</option>
                    {rawMaterials.map((material) => (
                      <option key={material.id} value={material.id.toString()}>
                        {material.name} ({material.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.quantity}
                    onChange={(e) => updateRecipeItem(index, "quantity", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRecipeItem(index)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  🗑️
                </button>
              </div>
            ))}
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
              {isSubmitting ? "Saving..." : menuItem?.recipe ? "Update Recipe" : "Create Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
