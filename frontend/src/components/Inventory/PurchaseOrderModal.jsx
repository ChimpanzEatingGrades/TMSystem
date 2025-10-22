"use client"

import { useState, useEffect } from "react"
import { X, Plus, Minus, ShoppingCart, Package, Calendar, FileText, AlertTriangle, Trash2 } from "lucide-react"
import { getUnits, getRawMaterials } from "../../api/inventoryAPI" // ✅ proper imports
import { ACCESS_TOKEN } from "../../constants"

const PurchaseOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [purchaseDate, setPurchaseDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([
    { name: "", quantity: "", unit: "", unitPrice: "", totalPrice: 0, isNewMaterial: false, selectedMaterial: "", expiry_date: "" },
  ])
  const [units, setUnits] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setPurchaseDate(new Date().toISOString().split("T")[0])
      setNotes("")
      setItems([
        { name: "", quantity: "", unit: "", unitPrice: "", totalPrice: 0, isNewMaterial: false, selectedMaterial: "", expiry_date: "" },
      ])
      setError("")
      fetchUnits()
      fetchRawMaterials()
    }
  }, [isOpen])

  const fetchUnits = async () => {
    setLoadingUnits(true)
    try {
      const res = await getUnits()
      setUnits(res.data)
    } catch (err) {
      console.error(err)
      setError("Failed to load units.")
    } finally {
      setLoadingUnits(false)
    }
  }

  const fetchRawMaterials = async () => {
    setLoadingMaterials(true)
    try {
      const res = await getRawMaterials()
      setRawMaterials(res.data)
    } catch (err) {
      console.error(err)
      setError("Failed to load raw materials.")
    } finally {
      setLoadingMaterials(false)
    }
  }

  const addItem = () =>
    setItems([
      ...items,
      { name: "", quantity: "", unit: "", unitPrice: "", totalPrice: 0, isNewMaterial: false, selectedMaterial: "", expiry_date: "" },
    ])

  const removeItem = (idx) => items.length > 1 && setItems(items.filter((_, i) => i !== idx))

  const updateItem = (idx, field, value) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }

    if (field === "selectedMaterial" && value) {
      const material = rawMaterials.find((m) => m.id === Number.parseInt(value))
      if (material) {
        newItems[idx].name = material.name
        newItems[idx].unit = material.unit
        newItems[idx].isNewMaterial = false
      }
    }

    if (field === "isNewMaterial" && value === true) {
      newItems[idx].selectedMaterial = ""
      newItems[idx].name = ""
      newItems[idx].unit = ""
    }

    if (field === "quantity" || field === "unitPrice") {
      const qty = Number.parseFloat(newItems[idx].quantity) || 0
      const price = Number.parseFloat(newItems[idx].unitPrice) || 0
      newItems[idx].totalPrice = qty * price
    }
    setItems(newItems)
  }

  const calculateGrandTotal = () => {
    return items.reduce((total, item) => total + (item.totalPrice || 0), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const token = localStorage.getItem(ACCESS_TOKEN)
    if (!token) {
      setError("You must be logged in to create a purchase order.")
      setLoading(false)
      return
    }

    try {
      const validItems = items.filter((i) => {
        if (i.isNewMaterial) {
          return i.name && i.quantity && i.unit && i.unitPrice
        } else {
          return i.selectedMaterial && i.quantity && i.unit && i.unitPrice
        }
      })
      if (!validItems.length) throw new Error("Add at least one item.")

      const itemsWithUnitIds = validItems.map((i) => {
        const unitObj = units.find((u) => u.abbreviation === i.unit)
        if (!unitObj) throw new Error(`Unit "${i.unit}" not found`)
        return {
          name: i.name,
          quantity: Number.parseFloat(i.quantity),
          unit: unitObj.id,
          unit_price: Number.parseFloat(i.unitPrice),
          total_price: Number.parseFloat(i.totalPrice),
          expiry_date: i.expiry_date,
        }
      })

      const res = await fetch("/inventory/purchase-orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchase_date: purchaseDate,
          notes,
          items: itemsWithUnitIds,
        }),
      })
      if (!res.ok) throw new Error("Failed to create purchase order.")
      const data = await res.json()

      // Notify alerts panel to recompute and refresh
      window.dispatchEvent(new CustomEvent('refreshInventory'))

      setItems([
        { name: "", quantity: "", unit: "", unitPrice: "", totalPrice: 0, isNewMaterial: false, selectedMaterial: "", expiry_date: "" },
      ])
      setNotes("")
      onClose()
      if (onSuccess) {
        try {
          onSuccess(data)
        } catch (error) {
          console.error("Error in onSuccess callback:", error)
        }
      }
    } catch (err) {
      console.error("Error creating purchase order:", err)
      setError(
        err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to create purchase order.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={28} className="text-[#FFC601]" />
            Create Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                  placeholder="Add any notes about this purchase order"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={20} />
                  Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-[#FFC601] hover:bg-yellow-500 text-black font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Item {idx + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors duration-200"
                        >
                          <Minus size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      {/* Material Selection */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={!item.isNewMaterial}
                                onChange={() => updateItem(idx, "isNewMaterial", false)}
                                className="mr-2"
                              />
                              <span className="text-sm">Existing</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={item.isNewMaterial}
                                onChange={() => updateItem(idx, "isNewMaterial", true)}
                                className="mr-2"
                              />
                              <span className="text-sm">New</span>
                            </label>
                          </div>

                          {item.isNewMaterial ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(idx, "name", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                              placeholder="Enter material name"
                              required
                            />
                          ) : (
                            <select
                              value={item.selectedMaterial}
                              onChange={(e) => updateItem(idx, "selectedMaterial", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                              required
                            >
                              <option value="">Select material...</option>
                              {rawMaterials.map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                          step="0.001"
                          min="0.001"
                          required
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                        {item.isNewMaterial ? (
                          <select
                            value={item.unit}
                            onChange={(e) => updateItem(idx, "unit", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                            required
                          >
                            <option value="">Select unit...</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.abbreviation}>
                                {unit.abbreviation}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={item.unit}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                            readOnly
                          />
                        )}
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>

                      {/* Expiry Date - MAKE IT MORE VISIBLE */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                          <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          value={item.expiry_date || ''}
                          onChange={(e) => updateItem(idx, 'expiry_date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                          placeholder="Select date"
                        />
                      </div>
                    </div>

                    {/* Total Price Display with Expiry Info */}
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        {item.expiry_date && (
                          <span className="text-sm text-orange-600 flex items-center gap-1">
                            <Calendar size={14} />
                            Expires: {new Date(item.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">Total: </span>
                        <span className="font-semibold text-lg text-green-600">₱{item.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-right">
                  <span className="text-lg text-gray-600">Grand Total: </span>
                  <span className="text-2xl font-bold text-green-600">₱{calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || loadingUnits || loadingMaterials}
            className="px-6 py-3 bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                Creating...
              </>
            ) : loadingUnits || loadingMaterials ? (
              "Loading..."
            ) : (
              <>
                <ShoppingCart size={16} />
                Create Purchase Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PurchaseOrderModal
