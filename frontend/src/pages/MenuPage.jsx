"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, List } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import {
  getMenuItems,
  deleteMenuItem,
  getCategories,
} from "../api/inventoryAPI.js";
import MenuItemModal from "../components/MenuItems/MenuItemModal.jsx";
import RecipeModal from "../components/MenuItems/RecipeModal.jsx";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // recipe modal state
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Categories
      const catRes = await getCategories();
      const catData = catRes.data?.results ?? catRes.data;
      const cats = Array.isArray(catData) ? catData : [];
      setCategories(cats);

      if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0].id);
      }

      // Menu Items
      const itemRes = await getMenuItems();
      const itemData = itemRes.data?.results ?? itemRes.data;
      setMenuItems(Array.isArray(itemData) ? itemData : []);
    } catch (err) {
      console.error("Error loading data", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await deleteMenuItem(id);
      loadData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingItem(null);
    loadData(); // reload after save
  };

  const handleRecipeSave = () => {
    setShowRecipeModal(false);
    setSelectedRecipeItem(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-black mb-8">Menu Items</h1>

        {/* Categories Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems
            .filter(
              (item) =>
                !activeCategory || item.category?.id === activeCategory
            )
            .map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-black">{item.name}</h3>
                  <span className="text-[#DD7373] font-bold text-lg">
                    ₱{item.price}
                  </span>
                </div>
                {item.picture && (
                  <img
                    src={item.picture}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                )}
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Edit size={16} /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash2 size={16} /> Delete
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRecipeItem(item);
                      setShowRecipeModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <List size={16} /> Ingredients
                  </button>
                </div>
              </div>
            ))}

          {/* Add New Button */}
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:text-black hover:border-gray-500 transition"
          >
            <Plus size={24} className="mr-2" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Modal for Add/Edit menu item */}
      {showModal && (
        <MenuItemModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          editingItem={editingItem}
        />
      )}

      {/* Modal for Recipe/Ingredients */}
      {showRecipeModal && (
        <RecipeModal
          onClose={() => setShowRecipeModal(false)}
          onSave={handleRecipeSave}
          menuItem={selectedRecipeItem}
        />
      )}
    </div>
  );
}
