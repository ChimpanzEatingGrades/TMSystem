"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, List } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import {
  getMenuItems,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/inventoryAPI.js";
import MenuItemModal from "../components/MenuItems/MenuItemModal.jsx";
import RecipeModal from "../components/MenuItems/RecipeModal.jsx";
import CategoryModal from "../components/MenuItems/CategoryModal.jsx";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  // Menu item modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Recipe modal state
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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

  // --- Menu Item CRUD ---
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await deleteMenuItem(id);
      loadData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSaveItem = () => {
    setShowModal(false);
    setEditingItem(null);
    loadData();
  };

  // --- Recipe CRUD ---
  const handleSaveRecipe = () => {
    setShowRecipeModal(false);
    setSelectedRecipeItem(null);
    loadData();
  };

  // --- Category CRUD ---
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      loadData();
    } catch (err) {
      console.error("Delete category failed", err);
    }
  };

  const handleSaveCategory = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-black">Menu Items</h1>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-1 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <button
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {cat.name}
              </button>
              <button
                onClick={() => {
                  setEditingCategory(cat);
                  setShowCategoryModal(true);
                }}
                className="p-1 text-blue-500 hover:text-blue-700"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems
            .filter((item) => !activeCategory || item.category?.id === activeCategory)
            .map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-black">{item.name}</h3>
                  <span className="text-[#DD7373] font-bold text-lg">₱{item.price}</span>
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
                    onClick={() => handleDeleteItem(item.id)}
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

          {/* Add New Item */}
          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 hover:text-black hover:border-gray-500 transition"
          >
            <Plus size={24} className="mr-2" /> Add New Item
          </button>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <MenuItemModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveItem}
          editingItem={editingItem}
        />
      )}

      {showRecipeModal && selectedRecipeItem && (
        <RecipeModal
          onClose={() => setShowRecipeModal(false)}
          onSave={handleSaveRecipe}
          existingRecipe={selectedRecipeItem.recipe ?? {
            id: null,
            name: "",
            description: "",
            yield_quantity: 1,
            yield_uom: "pcs",
            items: [],
          }}
          menuItemId={selectedRecipeItem.id}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
          editingCategory={editingCategory}
        />
      )}
    </div>
  );
}
