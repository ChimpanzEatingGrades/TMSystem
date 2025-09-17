import { useNavigate } from "react-router-dom";

export default function MenuList({ items, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.id} className="border rounded shadow p-4 flex flex-col">
          {item.picture && (
            <img
              src={item.picture}
              alt={item.name}
              className="h-40 w-full object-cover rounded mb-2"
            />
          )}
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <p className="text-gray-600">₱{item.price}</p>
          <p className="flex-1 text-sm mt-2">{item.description}</p>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => navigate(`/menu/${item.id}/edit`)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
