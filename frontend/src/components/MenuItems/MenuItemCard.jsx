"use client"

import { Edit, Trash2, Clock, Calendar, CheckCircle, XCircle, Eye } from "lucide-react"

export default function MenuItemCard({ item, viewMode, status, onEdit, onDelete }) {
  const branchAvail = item.branch_availability && item.branch_availability[0]
  const { isActive, isInDateRange, isInTimeRange, isAvailable } = status

  const StatusBadge = ({ isAvailable, isActive, isInDateRange, isInTimeRange }) => {
    if (isAvailable) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          <CheckCircle size={12} />
          Available
        </span>
      )
    }

    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
          <XCircle size={12} />
          Inactive
        </span>
      )
    }

    if (!isInDateRange) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          <Calendar size={12} />
          Out of Date Range
        </span>
      )
    }

    if (!isInTimeRange) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          <Clock size={12} />
          Out of Time Range
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
        <XCircle size={12} />
        Unavailable
      </span>
    )
  }

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {item.picture ? (
              <img src={item.picture || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Eye size={20} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-black truncate">{item.name}</h3>
                <p className="text-sm text-gray-600 truncate">{item.description}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-secondary">₱{item.price}</div>
                <div className="text-xs text-gray-500">{item.category?.name}</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge {...status} />
                {branchAvail?.valid_from && (
                  <span className="text-xs text-gray-500">
                    Valid from {new Date(branchAvail.valid_from).toLocaleDateString()}
                  </span>
                )}
                {branchAvail?.available_from && branchAvail?.available_to && (
                  <span className="text-xs text-gray-500">
                    {branchAvail.available_from} - {branchAvail.available_to}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-gray-400 hover:text-primary hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                  title="Edit item"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-secondary hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Image */}
      <div className="aspect-video bg-gray-100 overflow-hidden">
        {item.picture ? (
          <img
            src={item.picture || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Eye size={32} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-black text-lg mb-1 truncate">{item.name}</h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
            <div className="text-xs text-gray-500 mb-3">{item.category?.name}</div>
          </div>
          <div className="text-xl font-bold text-secondary ml-4">₱{item.price}</div>
        </div>

        {/* Status and Time Info */}
        <div className="space-y-2 mb-4">
          <StatusBadge {...status} />

          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {branchAvail?.valid_from && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                From {new Date(branchAvail.valid_from).toLocaleDateString()}
              </span>
            )}
            {branchAvail?.valid_until && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Until {new Date(branchAvail.valid_until).toLocaleDateString()}
              </span>
            )}
            {branchAvail?.available_from && branchAvail?.available_to && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {branchAvail.available_from} - {branchAvail.available_to}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 bg-primary hover:bg-primary/90 text-black font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex-1 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-secondary font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
