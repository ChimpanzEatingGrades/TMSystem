import React, { useState, useEffect } from 'react'
import api from '../api'

const UnitManagementModal = ({ isOpen, onClose }) => {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '', description: '' })

  useEffect(() => {
    if (isOpen) {
      fetchUnits()
    }
  }, [isOpen])

  const fetchUnits = async () => {
    try {
      const response = await api.get('/inventory/units/')
      setUnits(response.data)
    } catch (err) {
      console.error('Failed to fetch units:', err)
      setError('Failed to fetch units')
    }
  }

  const handleAddUnit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/inventory/units/', newUnit)
      setNewUnit({ name: '', abbreviation: '', description: '' })
      setShowAddForm(false)
      setSuccess('Unit added successfully')
      fetchUnits()
    } catch (err) {
      console.error('Failed to add unit:', err)
      setError('Failed to add unit. Please check if abbreviation is unique.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUnit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.delete(`/inventory/units/${id}/`)
      setSuccess('Unit deleted successfully')
      fetchUnits()
    } catch (err) {
      console.error('Failed to delete unit:', err)
      setError('Failed to delete unit. It may be in use by existing materials.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Units of Measurement</h2>
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showAddForm ? 'Cancel' : 'Add New Unit'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddUnit} className="mb-6 p-4 border border-gray-300 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Add New Unit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Kilograms"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abbreviation
                </label>
                <input
                  type="text"
                  value={newUnit.abbreviation}
                  onChange={(e) => setNewUnit({ ...newUnit, abbreviation: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., kg"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newUnit.description}
                onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Brief description of the unit"
                rows="2"
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#FFC601] hover:bg-yellow-500 text-black rounded-md disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Unit'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Abbreviation</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr key={unit.id}>
                  <td className="border border-gray-300 px-4 py-2">{unit.name}</td>
                  <td className="border border-gray-300 px-4 py-2 font-mono">{unit.abbreviation}</td>
                  <td className="border border-gray-300 px-4 py-2">{unit.description || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => handleDeleteUnit(unit.id)}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {units.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No units found.</p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnitManagementModal
