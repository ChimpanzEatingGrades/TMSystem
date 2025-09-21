import { useEffect, useState } from "react";
import { getMenuCategories, getMenuItems } from "../api/inventoryAPI";
import MenuItemCard from "./MenuItemCard";
import MenuItemModal from "./MenuItemModal";

export default function MenuItemsPage() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    getMenuCategories().then(res => setCategories(res.data));
    getMenuItems().then(res => setMenuItems(res.data));
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Products</h1>
      {categories.map((cat) => (
        <div key={cat.id} className="mb-6">
          <h2 className="text-lg font-semibold">{cat.name}</h2>
          <div className="flex flex-col gap-2 mt-2">
            {menuItems.filter(item => item.category === cat.id).map(item => (
              <MenuItemCard key={item.id} item={item} onEdit={handleEdit} />
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 bg-yellow-400 p-4 rounded-full shadow-xl"
      >
        +
      </button>

      {showModal && (
        <MenuItemModal
          onClose={() => setShowModal(false)}
          editingItem={editingItem}
        />
      )}
    </div>
  );
}
