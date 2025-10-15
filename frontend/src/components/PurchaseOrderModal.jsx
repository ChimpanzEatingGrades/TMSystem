import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../api'
import { ACCESS_TOKEN } from '../constants'

const PurchaseOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [purchaseDate, setPurchaseDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0, isNewMaterial: false, selectedMaterial: '', shelfLifeDays: 7, material_type: 'raw' }])
  const [units, setUnits] = useState([])
  const [rawMaterials, setRawMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPurchaseDate(new Date().toISOString().split('T')[0])
      setNotes('')
      setItems([{ name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0, isNewMaterial: false, selectedMaterial: '', shelfLifeDays: 7, material_type: 'raw' }])
      setError('')
      fetchUnits()
      fetchRawMaterials()
    }
  }, [isOpen])

  const fetchUnits = async () => {
    setLoadingUnits(true)
    try {
      const res = await api.get('/inventory/units/')
      setUnits(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load units.')
    } finally {
      setLoadingUnits(false)
    }
  }

  const fetchRawMaterials = async () => {
    setLoadingMaterials(true)
    try {
      const res = await api.get('/inventory/rawmaterials/')
      setRawMaterials(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load raw materials.')
    } finally {
      setLoadingMaterials(false)
    }
  }

  const addItem = () => setItems([...items, { 
    name: '', 
    quantity: '', 
    unit: '', 
    unitPrice: '', 
    totalPrice: 0, 
    isNewMaterial: false, 
    selectedMaterial: '',
    shelfLifeDays: 7,  // Default shelf life
    material_type: 'raw'  // Default type
  }])

  const removeItem = (idx) => items.length > 1 && setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    
    // If selecting an existing material, populate name, unit, and shelf life
    if (field === 'selectedMaterial' && value) {
      const material = rawMaterials.find(m => m.id === parseInt(value))
      if (material) {
        newItems[idx].name = material.name
        newItems[idx].unit = material.unit
        newItems[idx].isNewMaterial = false
        newItems[idx].shelfLifeDays = material.shelf_life_days || 7
        newItems[idx].material_type = material.material_type || 'raw'  // Also set material type
      }
    }
    
    // If toggling to new material, clear the selected material
    if (field === 'isNewMaterial' && value === true) {
      newItems[idx].selectedMaterial = ''
      newItems[idx].shelfLifeDays = 7  // Default for new materials
      newItems[idx].material_type = 'raw'  // Default type
    }
    
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[idx].quantity) || 0
      const price = parseFloat(newItems[idx].unitPrice) || 0
      newItems[idx].totalPrice = qty * price
    }
    setItems(newItems)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Check if user is authenticated
    const token = localStorage.getItem(ACCESS_TOKEN)
    if (!token) {
      setError('You must be logged in to create a purchase order.')
      setLoading(false)
      return
    }
    
    try {
      const validItems = items.filter(i => {
        if (i.isNewMaterial) {
          return i.name && i.quantity && i.unit && i.unitPrice
        } else {
          return i.selectedMaterial && i.quantity && i.unit && i.unitPrice
        }
      })
      if (!validItems.length) throw new Error('Add at least one item.')

      const itemsWithUnitIds = validItems.map(i => {
        const unitObj = units.find(u => u.abbreviation === i.unit)
        if (!unitObj) throw new Error(`Unit "${i.unit}" not found`)
        
        // Prepare item data
        const itemData = {
          name: i.name,
          quantity: parseFloat(i.quantity),
          unit: unitObj.id,
          unit_price: parseFloat(i.unitPrice),
          total_price: parseFloat(i.totalPrice),
          material_type: i.material_type || 'raw',
        }
        
        // Only add shelf_life_days if material is not supplies
        if (i.material_type !== 'supplies') {
          itemData.shelf_life_days = parseInt(i.shelfLifeDays) || 7
        }
        // For supplies, shelf_life_days should be null/undefined
        
        return itemData
      })
      
      const requestData = {
        purchase_date: purchaseDate,
        notes,
        items: itemsWithUnitIds
      }
      
      console.log('Sending purchase order data:', requestData)
      console.log('Items detail:', JSON.stringify(itemsWithUnitIds, null, 2))
      
      const res = await api.post('/inventory/purchase-orders/', requestData)

      setItems([{ name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0, isNewMaterial: false, selectedMaterial: '', shelfLifeDays: 7, material_type: 'raw' }])
      setNotes('')
      
      // Close modal first
      onClose()
      
      // Then call success callback
      if (onSuccess) {
        try {
          onSuccess(res.data)
        } catch (error) {
          console.error('Error in onSuccess callback:', error)
        }
      }
    } catch (err) {
      console.error('Error creating purchase order:', err)
      console.error('Error response data:', err.response?.data)
      console.error('Error response data (full):', JSON.stringify(err.response?.data, null, 2))  // Add this line
      console.error('Error status:', err.response?.status)
      
      // Better error message
      let errorMessage = 'Failed to create purchase order.'
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error
        } else {
          // Show validation errors if available
          const errors = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ')
          errorMessage = errors || errorMessage
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  try {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create Purchase Order</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="Additional notes..." />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Items</h3>
              <button type="button" onClick={addItem} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">Add Item</button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="flex items-center space-x-4 mb-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`materialType_${idx}`}
                          checked={!item.isNewMaterial}
                          onChange={() => updateItem(idx, 'isNewMaterial', false)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Select existing material</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`materialType_${idx}`}
                          checked={item.isNewMaterial}
                          onChange={() => updateItem(idx, 'isNewMaterial', true)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Add new material</span>
                      </label>
                    </div>
                    
                    {!item.isNewMaterial ? (
                      <select
                        value={item.selectedMaterial || ''}
                        onChange={e => updateItem(idx, 'selectedMaterial', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        required
                        disabled={loadingMaterials}
                      >
                        <option value="">{loadingMaterials ? 'Loading materials...' : 'Select material'}</option>
                        {rawMaterials && rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.quantity} {m.unit}) - {m.material_type_display}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="New material name"
                          value={item.name}
                          onChange={e => updateItem(idx, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          required
                        />
                        
                        {/* Add Material Type Selector for New Materials */}
                        <select
                          value={item.material_type || 'raw'}
                          onChange={e => updateItem(idx, 'material_type', e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-blue-50"
                        >
                          <option value="raw">🥩 Raw Material (Ingredients - meat, vegetables, etc.)</option>
                          <option value="processed">🥤 Processed Good (Ready-to-use - sodas, condiments, etc.)</option>
                          <option value="semi_processed">🍖 Semi-Processed (Prepared - ground meat, chopped vegetables, etc.)</option>
                          <option value="supplies">🍴 Supplies & Utensils (Spoons, gloves, napkins, containers, etc.)</option>
                        </select>
                        
                        <p className="text-xs text-gray-500 italic">
                          {item.material_type === 'raw' && '📋 Raw materials typically need processing and have shorter shelf life'}
                          {item.material_type === 'processed' && '📋 Processed goods are ready to use and usually have longer shelf life'}
                          {item.material_type === 'semi_processed' && '📋 Semi-processed items are partially prepared and ready for cooking'}
                          {item.material_type === 'supplies' && '📋 Supplies are non-consumable items like utensils, packaging, and disposables'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Unit</label>
                      <select
                        value={item.unit}
                        onChange={e => updateItem(idx, 'unit', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        required
                        disabled={loadingUnits || (!item.isNewMaterial && item.selectedMaterial)}
                      >
                        <option value="">{loadingUnits ? 'Loading units...' : 'Unit'}</option>
                        {units && units.map(u => (
                          <option key={u.id} value={u.abbreviation}>{u.abbreviation}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    {/* Shelf Life - Conditional rendering based on material type */}
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Shelf Life {item.material_type === 'supplies' ? '(N/A for supplies)' : '(Days)'}
                      </label>
                      {item.material_type === 'supplies' ? (
                        <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500 italic">
                          Non-perishable
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={item.shelfLifeDays || ''}
                          onChange={e => updateItem(idx, 'shelfLifeDays', e.target.value || null)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          min="1"
                          placeholder={
                            item.material_type === 'raw' ? '3-7' : 
                            item.material_type === 'processed' ? '30-365' : 
                            '7-14'
                          }
                          title={
                            item.isNewMaterial 
                              ? `Set shelf life for this new ${item.material_type === 'raw' ? 'raw material' : item.material_type === 'processed' ? 'processed good' : 'semi-processed item'}` 
                              : `Default: ${item.shelfLifeDays} days. You can override this for this specific purchase.`
                          }
                        />
                      )}
                      {!item.isNewMaterial && item.material_type !== 'supplies' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Default: {rawMaterials.find(m => m.id === parseInt(item.selectedMaterial))?.shelf_life_days || 'N/A'} days
                        </p>
                      )}
                      {item.isNewMaterial && item.material_type !== 'supplies' && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 {item.material_type === 'raw' && 'Raw: 3-7 days'}
                          {item.material_type === 'processed' && 'Processed: 30-365 days'}
                          {item.material_type === 'semi_processed' && 'Semi: 7-14 days'}
                        </p>
                      )}
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Total Price</label>
                      <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-gray-50 rounded-md">
                        ₱{item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Actions</label>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm w-full"
                        >
                          Remove Item
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced info message - only for perishable items */}
                  {item.material_type !== 'supplies' && item.shelfLifeDays && purchaseDate && (
                    <div className={`mt-2 text-xs rounded px-3 py-2 border ${
                      item.material_type === 'raw' 
                        ? 'bg-orange-50 border-orange-200 text-orange-700' 
                        : item.material_type === 'processed'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-purple-50 border-purple-200 text-purple-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            {item.material_type === 'raw' && '🥩 Raw Material'}
                            {item.material_type === 'processed' && '🥤 Processed Good'}
                            {item.material_type === 'semi_processed' && '🍖 Semi-Processed'}
                          </span>
                          {' '}- This batch will expire on{' '}
                          <strong>
                            {new Date(new Date(purchaseDate).getTime() + parseInt(item.shelfLifeDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </strong>
                          {' '}({item.shelfLifeDays} days from purchase)
                        </div>
                        {!item.isNewMaterial && item.shelfLifeDays != rawMaterials.find(m => m.id === parseInt(item.selectedMaterial))?.shelf_life_days && (
                          <span className="text-orange-600 font-medium">
                            ⚠️ Custom shelf life
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Info for supplies */}
                  {item.material_type === 'supplies' && (
                    <div className="mt-2 text-xs rounded px-3 py-2 border bg-gray-50 border-gray-200 text-gray-700">
                      <span className="font-medium">🍴 Supplies & Utensils</span>
                      {' '}- Non-perishable or long shelf life (no expiry tracking)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || loadingUnits || loadingMaterials} className="px-4 py-2 bg-[#FFC601] hover:bg-yellow-500 text-black rounded-md disabled:opacity-50">{loading ? 'Creating...' : loadingUnits || loadingMaterials ? 'Loading...' : 'Create Purchase Order'}</button>
          </div>
        </form>
      </div>
    </div>
    )
  } catch (error) {
    console.error('Error rendering PurchaseOrderModal:', error)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">Something went wrong. Please try again.</p>
          <button onClick={onClose} className="px-4 py-2 bg-red-500 text-white rounded-md">
            Close
          </button>
        </div>
      </div>
    )
  }
}

export default PurchaseOrderModal
