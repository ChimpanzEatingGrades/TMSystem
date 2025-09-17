"use client"

export function MenuItemCard({ item, onEdit, onEditRecipe }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-0">
        {item.picture ? (
          <img src={item.picture || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {item.is_active ? "👁️ Active" : "👁️‍🗨️ Inactive"}
            </span>
          </div>
        </div>
        <p className="text-2xl font-bold text-blue-600 mb-2">${item.price}</p>
        {item.description && <p className="text-sm text-gray-600 mb-3">{item.description}</p>}
        {item.category && (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border">
            {item.category.name}
          </span>
        )}
        {item.valid_until && <p className="text-xs text-gray-500 mt-2">Valid until: {item.valid_until}</p>}
      </div>
      <div className="p-4 pt-0 flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onEditRecipe(item)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-1"
        >
          🍽️ Recipe
        </button>
      </div>
    </div>
  )
}
