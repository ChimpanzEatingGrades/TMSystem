"use client"

import { useEffect, useState } from "react"
import { X, Plus, Minus, ChefHat, Package } from "lucide-react"
import { getRawMaterials, createRecipe, updateRecipe } from "../../api/inventoryAPI"

export default function RecipeModal({ onClose, existingRecipe, onSave, menuItemId }) {
  const [rawMaterials, setRawMaterials] = useState([])
  const [selected, setSelected] = useState([])
  const [recipeName, setRecipeName] = useState("")
  const [description, setDescription] = useState("")
  const [yieldQty, setYieldQty] = useState(1)
  const [yieldUom, setYieldUom] = useState("pcs")
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadRawMaterials()
  }, [])

  useEffect(() => {
    if (existingRecipe) {
      setRecipeName(existingRecipe.name || "")
      setDescription(existingRecipe.description || "")
      setYieldQty(existingRecipe.yield_quantity || 1)
      setYieldUom(existingRecipe.yield_uom || "pcs")

      const initialSelected = (existingRecipe.items || []).map((item) => ({
        raw_material: item.raw_material?.id || item.raw_material || item.id,
        quantity: item.quantity || 1,
      }))
      setSelected(initialSelected)
    }
  }, [existingRecipe])

  const loadRawMaterials = async () => {
    try {
      const res = await getRawMaterials()
      const data = res.data?.results || res.data
      setRawMaterials(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load raw materials", err)
      setRawMaterials([])
    }
  }

  const filteredMaterials = rawMaterials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selected.find((item) => item.raw_material === material.id),
  )

  const handleAdd = (material) => {
    setSelected([...selected, { raw_material: material.id, quantity: 1 }])
    setSearchTerm("")
  }

  const handleChangeQty = (id, qty) => {
    const newQty = Math.max(0, Number(qty))
    setSelected(selected.map((item) => (item.raw_material === id ? { ...item, quantity: newQty } : item)))
  }

  const handleDelete = (id) => {
    setSelected(selected.filter((item) => item.raw_material !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name: recipeName,
      description,
      yield_quantity: yieldQty,
      yield_uom: yieldUom,
      items: selected.map(item => ({
        raw_material_id: item.raw_material,
        quantity: item.quantity,
      })),
    }

    try {
      // Only add menu_item if we are creating a new recipe
      if (!existingRecipe?.id) {
        payload.menu_item = menuItemId;
      }
      let recipe
      if (existingRecipe?.id) {
        const res = await updateRecipe(existingRecipe.id, payload)
        recipe = res.data || res
      } else {
        const res = await createRecipe(payload)
        recipe = res.data || res
      }

      onSave(recipe)
    } catch (err) {
      console.error("Save failed", err)
      alert("Failed to save recipe. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <ChefHat size={24} />
            Recipe & Ingredients
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Recipe Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black">Recipe Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Enter recipe name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yield Quantity</label>
                    <input
                      type="number"
                      value={yieldQty}
                      onChange={(e) => setYieldQty(Number(e.target.value))}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                    <input
                      type="text"
                      value={yieldUom}
                      onChange={(e) => setYieldUom(e.target.value)}
                      placeholder="pcs, kg, etc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter recipe description or instructions"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors resize-none"
                />
              </div>
            </div>

            {/* Selected Ingredients */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <Package size={20} />
                Selected Ingredients ({selected.length})
              </h3>

              {selected.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No ingredients added yet</p>
                  <p className="text-sm">Search and add ingredients below</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selected.map((item) => {
                    const material = rawMaterials.find((m) => m.id === item.raw_material)
                    return (
                      <div
                        key={item.raw_material}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-black">{material?.name || "Unknown Material"}</span>
                          {material?.unit && <span className="text-sm text-gray-500 ml-2">({material.unit})</span>}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleChangeQty(item.raw_material, item.quantity - 1)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleChangeQty(item.raw_material, e.target.value)}
                              min="0"
                              step="0.01"
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#FFC601]"
                            />
                            <button
                              type="button"
                              onClick={() => handleChangeQty(item.raw_material, item.quantity + 1)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.raw_material)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors duration-200 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Add Ingredients */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black">Add Ingredients</h3>

              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for ingredients..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-colors"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredMaterials.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {searchTerm ? "No ingredients found" : "Start typing to search ingredients"}
                  </p>
                ) : (
                  filteredMaterials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => handleAdd(material)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-[#FFC601] hover:text-black transition-colors duration-200 flex items-center justify-between"
                    >
                      <span className="font-medium">{material.name}</span>
                      {material.unit && <span className="text-sm text-gray-500">({material.unit})</span>}
                    </button>
                  ))
                )}
              </div>
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
                <>Save Recipe</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}