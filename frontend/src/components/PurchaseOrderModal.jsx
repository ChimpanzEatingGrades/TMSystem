import React, { useState, useEffect } from 'react'
import api from '../api'

const PurchaseOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [purchaseDate, setPurchaseDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0 }])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Set today's date as default
      setPurchaseDate(new Date().toISOString().split('T')[0])
      fetchUnits()
    }
  }, [isOpen])

  const fetchUnits = async () => {
    setLoadingUnits(true)
    try {
      console.log('Fetching units from:', '/inventory/units/')
      const response = await api.get('/inventory/units/')
      console.log('Units response:', response.data)
      setUnits(response.data)
    } catch (err) {
      console.error('Failed to fetch units:', err)
      console.error('Units error response:', err.response?.data)
      setError('Failed to load units. Please try again.')
    } finally {
      setLoadingUnits(false)
    }
  }

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Calculate total price if quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(newItems[index].quantity) || 0
      const unitPrice = parseFloat(newItems[index].unitPrice) || 0
      newItems[index].totalPrice = quantity * unitPrice
    }
    
    setItems(newItems)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if units are loaded
      if (units.length === 0) {
        setError('Units are not loaded yet. Please wait and try again.')
        setLoading(false)
        return
      }

      // Validate items
      const validItems = items.filter(item => 
        item.name.trim() && item.quantity && item.unit && item.unitPrice
      )

      if (validItems.length === 0) {
        setError('Please add at least one item')
        setLoading(false)
        return
      }

      // Find unit IDs
      const itemsWithUnitIds = validItems.map(item => {
        const unit = units.find(u => u.abbreviation === item.unit)
        console.log(`Looking for unit with abbreviation: ₱{item.unit}`)
        console.log(`Available units:`, units)
        console.log(`Found unit:`, unit)
        
        if (!unit) {
          throw new Error(`Unit with abbreviation '₱{item.unit}' not found`)
        }
        
        return {
          name: item.name,
          quantity: parseFloat(item.quantity),
          unit: unit.id,
          unit_price: parseFloat(item.unitPrice),
          total_price: parseFloat(item.totalPrice)
        }
      })

      const purchaseOrderData = {
        purchase_date: purchaseDate,
        notes: notes,
        items: itemsWithUnitIds
      }

      console.log('Creating purchase order with data:', purchaseOrderData)
      console.log('API base URL:', api.defaults.baseURL)
      console.log('Request headers:', api.defaults.headers)
      
      const response = await api.post('/inventory/purchase-orders/', purchaseOrderData)
      console.log('Purchase order created:', response.data)
      
      // Reset form
      setItems([{ name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0 }])
      setNotes('')
      setError('')
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to create purchase order:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)
      setError(`Failed to create purchase order. ₱{err.response?.data?.detail || err.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Purchase Order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      required
                      disabled={loadingUnits}
                    >
                      <option value="">
                        {loadingUnits ? 'Loading units...' : 'Unit'}
                      </option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.abbreviation}>
                          {unit.abbreviation}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <div className="text-sm font-medium text-gray-700 px-2 py-2">
                    ₱{item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingUnits}
              className="px-4 py-2 bg-[#FFC601] hover:bg-yellow-500 text-black rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : loadingUnits ? 'Loading units...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PurchaseOrderModal
