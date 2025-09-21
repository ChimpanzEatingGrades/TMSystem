"use client"

import { useState, useEffect } from "react"
import { Settings, Plus, Trash2, X, AlertTriangle, CheckCircle } from "lucide-react"
import api from "../../api"

const UnitManagementModal = ({ isOpen, onClose }) => {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUnit, setNewUnit] = useState({ name: "", abbreviation: "", description: "" })

  useEffect(() => {
    if (isOpen) {
      fetchUnits()
    }
  }, [isOpen])

  const fetchUnits = async () => {
    try {
      const response = await api.get("/inventory/units/")
      setUnits(response.data)
    } catch (err) {
      console.error("Failed to fetch units:", err)
      setError("Failed to fetch units")
    }
  }

  const handleAddUnit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await api.post("/inventory/units/", newUnit)
      setNewUnit({ name: "", abbreviation: "", description: "" })
      setShowAddForm(false)
      setSuccess("Unit added successfully")
      fetchUnits()
    } catch (err) {
      console.error("Failed to add unit:", err)
      setError("Failed to add unit. Please check if abbreviation is unique.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUnit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await api.delete(`/inventory/units/${id}/`)
      setSuccess("Unit deleted successfully")
      fetchUnits()
    } catch (err) {
      console.error("Failed to delete unit:", err)
      setError("Failed to delete unit. It may be in use by existing materials.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-[#FFC601]" size={28} />
            Manage Units of Measurement
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
            >
              <Plus size={20} />
              {showAddForm ? "Cancel" : "Add New Unit"}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-8 p-6 border border-gray-200 rounded-xl bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="text-[#FFC601]" size={20} />
                Add New Unit
              </h3>
              <form onSubmit={handleAddUnit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                      placeholder="e.g., Kilograms"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation</label>
                    <input
                      type="text"
                      value={newUnit.abbreviation}
                      onChange={(e) => setNewUnit({ ...newUnit, abbreviation: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                      placeholder="e.g., kg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={newUnit.description}
                    onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
                    placeholder="Brief description of the unit"
                    rows="2"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add Unit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Abbreviation</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{unit.abbreviation}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{unit.description || "-"}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {units.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Settings size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No units found</p>
              <p>Add your first unit of measurement to get started</p>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnitManagementModal
