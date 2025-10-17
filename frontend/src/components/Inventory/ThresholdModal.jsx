import { useState, useEffect } from 'react'
import { X, AlertTriangle, Save, TrendingDown, Package } from 'lucide-react'

const ThresholdModal = ({ isOpen, onClose, material, onSave }) => {
  const [formData, setFormData] = useState({
    minimum_threshold: '',
    reorder_level: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (material) {
      setFormData({
        minimum_threshold: material.minimum_threshold?.toString() || '10',
        reorder_level: material.reorder_level?.toString() || '20',
      })
    }
  }, [material])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const validateForm = () => {
    const minThreshold = parseFloat(formData.minimum_threshold)
    const reorderLevel = parseFloat(formData.reorder_level)

    if (isNaN(minThreshold) || minThreshold < 0) {
      setError('Minimum threshold must be a valid positive number')
      return false
    }

    if (isNaN(reorderLevel) || reorderLevel < 0) {
      setError('Reorder level must be a valid positive number')
      return false
    }

    if (reorderLevel < minThreshold) {
      setError('Reorder level should be greater than or equal to minimum threshold')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    setError('')

    try {
      const updateData = {
        minimum_threshold: parseFloat(formData.minimum_threshold),
        reorder_level: parseFloat(formData.reorder_level),
      }

      await onSave(material.id, updateData)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update thresholds')
    } finally {
      setSaving(false)
    }
  }

  const getStockStatus = () => {
    if (!material) return null

    const currentQty = material.quantity
    const minThreshold = parseFloat(formData.minimum_threshold)
    const reorderLevel = parseFloat(formData.reorder_level)

    if (currentQty <= minThreshold) {
      return {
        status: 'Low Stock',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: AlertTriangle,
        message: `Current stock (${currentQty} ${material.unit}) is at or below minimum threshold`
      }
    } else if (currentQty <= reorderLevel) {
      return {
        status: 'Reorder Soon',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: TrendingDown,
        message: `Current stock (${currentQty} ${material.unit}) has reached reorder level`
      }
    } else {
      return {
        status: 'Adequate Stock',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: Package,
        message: `Current stock (${currentQty} ${material.unit}) is sufficient`
      }
    }
  }

  if (!isOpen || !material) return null

  const stockStatus = getStockStatus()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-blue-600" size={28} />
              Set Stock Thresholds
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure low stock and reorder alerts for <span className="font-semibold">{material.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Current Status */}
          {stockStatus && (
            <div className={`border rounded-lg p-4 mb-6 ${stockStatus.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <stockStatus.icon size={20} />
                <span className="font-semibold">{stockStatus.status}</span>
              </div>
              <p className="text-sm">{stockStatus.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Material Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Material Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="ml-2 font-semibold text-gray-900">{material.quantity} {material.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unit:</span>
                  <span className="ml-2 font-semibold text-gray-900">{material.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-semibold text-gray-900">{material.material_type_display || 'Raw Material'}</span>
                </div>
                {material.shelf_life_days && (
                  <div>
                    <span className="text-gray-600">Shelf Life:</span>
                    <span className="ml-2 font-semibold text-gray-900">{material.shelf_life_days} days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Threshold Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Threshold Settings</h3>
              
              {/* Minimum Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Threshold (Low Stock Alert)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.minimum_threshold}
                    onChange={(e) => handleChange('minimum_threshold', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 10"
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-500 text-sm font-medium">
                    {material.unit}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Alert will trigger when stock drops to or below this level
                </p>
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level (Restock Reminder)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => handleChange('reorder_level', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 20"
                    required
                  />
                  <span className="absolute right-4 top-3 text-gray-500 text-sm font-medium">
                    {material.unit}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingDown size={12} className="inline mr-1" />
                  Reminder to restock when stock drops to this level (should be ≥ minimum threshold)
                </p>
              </div>
            </div>

            {/* Calculation Guide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Threshold Calculation Guide</h4>
              <div className="space-y-1 text-xs text-blue-800">
                <p><strong>Minimum Threshold =</strong> (Daily Usage × Lead Time) + Safety Buffer</p>
                <p><strong>Reorder Level =</strong> Minimum Threshold × 1.5 to 2</p>
                <p className="mt-2 text-blue-700">
                  <strong>Example:</strong> If you use 5 {material.unit}/day, lead time is 3 days, buffer is 5 {material.unit}:
                </p>
                <p className="text-blue-700">
                  • Minimum = (5 × 3) + 5 = <strong>20 {material.unit}</strong>
                </p>
                <p className="text-blue-700">
                  • Reorder = 20 × 1.5 = <strong>30 {material.unit}</strong>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Thresholds
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ThresholdModal
