import { useState, useEffect } from "react";
import { createMenuItem, updateMenuItem, getCategories } from "../../api/inventoryApi";
import RecipeModal from "./RecipeModal";

export default function MenuItemModal({ onClose, onSave, editingItem }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: editingItem?.name || "",
    price: editingItem?.price || "",
    valid_from: editingItem?.valid_from || "",
    valid_until: editingItem?.valid_until || "",
    no_end_date: !editingItem?.valid_until,
    available_from: editingItem?.available_from || "00:00",
    available_to: editingItem?.available_to || "23:59",
    status: editingItem?.status || "available",
    picture: null,
    category_id: editingItem?.category?.id || "", // <-- add category
  });
  const [showRecipe, setShowRecipe] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      const data = res.data?.results ?? res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    });
  };

  const handleSubmit = async () => {
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        data.append(key, formData[key]);
      }
    });

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
      } else {
        await createMenuItem(data);
      }
      onSave();
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[400px] p-6 space-y-4">
        <h2 className="text-lg font-bold">{editingItem ? "Edit" : "Add"} Product</h2>

        {/* Name */}
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Price */}
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Category */}
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Valid From/Until */}
        <div className="flex gap-2">
          <input
            type="date"
            name="valid_from"
            value={formData.valid_from}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          {!formData.no_end_date && (
            <input
              type="date"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          )}
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="no_end_date"
            checked={formData.no_end_date}
            onChange={handleChange}
          />
          No End Date
        </label>

        {/* Available time */}
        <div className="flex gap-2">
          <input
            type="time"
            name="available_from"
            value={formData.available_from}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          <input
            type="time"
            name="available_to"
            value={formData.available_to}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Status */}
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        {/* Picture */}
        <input
          type="file"
          name="picture"
          accept="image/*"
          onChange={handleChange}
        />

        {/* Recipe Button */}
        <button
          onClick={() => setShowRecipe(true)}
          className="w-full bg-gray-200 p-2 rounded"
        >
          {editingItem ? "Edit Ingredients" : "Add Ingredients"}
        </button>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>

      {showRecipe && (
        <RecipeModal
          onClose={() => setShowRecipe(false)}
          existingRecipe={editingItem?.recipe}
          onSave={(recipe) => {
            setFormData({ ...formData, recipe_id: recipe.id }); // backend expects recipe_id
          }}
        />
      )}
    </div>
  );
}
