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
      setPurchaseDate(new Date().toISOString().split('T')[0])
      fetchUnits()
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

  const addItem = () => setItems([...items, { name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0 }])
  const removeItem = (idx) => items.length > 1 && setItems(items.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
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
    try {
      const validItems = items.filter(i => i.name && i.quantity && i.unit && i.unitPrice)
      if (!validItems.length) throw new Error('Add at least one item.')

      const itemsWithUnitIds = validItems.map(i => {
        const unitObj = units.find(u => u.abbreviation === i.unit)
        if (!unitObj) throw new Error(`Unit "${i.unit}" not found`)
        return {
          name: i.name,
          quantity: parseFloat(i.quantity),
          unit: unitObj.id,
          unit_price: parseFloat(i.unitPrice),
          total_price: parseFloat(i.totalPrice)
        }
      })

      const res = await api.post('/inventory/purchase-orders/', {
        purchase_date: purchaseDate,
        notes,
        items: itemsWithUnitIds
      })

      setItems([{ name: '', quantity: '', unit: '', unitPrice: '', totalPrice: 0 }])
      setNotes('')
      onSuccess(res.data) // pass the newly created order to parent
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || err.message || 'Failed to create purchase order.')
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
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4"><input type="text" placeholder="Item name" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required /></div>
                  <div className="col-span-2"><input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" min="0.01" step="0.01" required /></div>
                  <div className="col-span-2">
                    <select value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required disabled={loadingUnits}>
                      <option value="">{loadingUnits ? 'Loading units...' : 'Unit'}</option>
                      {units.map(u => <option key={u.id} value={u.abbreviation}>{u.abbreviation}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" min="0" step="0.01" required /></div>
                  <div className="col-span-1"><div className="text-sm font-medium text-gray-700 px-2 py-2">₱{item.totalPrice.toFixed(2)}</div></div>
                  <div className="col-span-1">{items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">×</button>}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || loadingUnits} className="px-4 py-2 bg-[#FFC601] hover:bg-yellow-500 text-black rounded-md disabled:opacity-50">{loading ? 'Creating...' : loadingUnits ? 'Loading units...' : 'Create Purchase Order'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PurchaseOrderModal
