import { useEffect, useState } from "react";
import { getMenuItems, deleteMenuItem } from "../api/menu";
import MenuList from "../components/MenuList";
import { useNavigate } from "react-router-dom";

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getMenuItems();
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load menu items", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await deleteMenuItem(id);
    fetchItems();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <button
          onClick={() => navigate("/menu/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Item
        </button>
      </div>
      <MenuList items={items} onDelete={handleDelete} />
    </div>
  );
}
