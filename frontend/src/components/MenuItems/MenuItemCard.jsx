export default function MenuItemCard({ item, onEdit }) {
  return (
    <div className="flex items-center justify-between border p-3 rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        {item.picture && (
          <img
            src={item.picture}
            alt={item.name}
            className="w-12 h-12 rounded object-cover"
          />
        )}
        <span className="font-medium">{item.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded bg-blue-200"
        >
          ✏️
        </button>
        <button className="p-2 rounded bg-red-200">🗑</button>
      </div>
    </div>
  );
}
