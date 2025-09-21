import { useState, useEffect } from "react";
import { createMenuItem, updateMenuItem, getCategories } from "../../api/inventoryApi";
import RecipeModal from "./RecipeModal";

export default function MenuItemModal({ onClose, onSave, editingItem }) {
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(editingItem?.picture || null);

  const [formData, setFormData] = useState({
    name: editingItem?.name || "",
    price: editingItem?.price || "",
    valid_from: editingItem?.valid_from || "",
    valid_until: editingItem?.valid_until || "",
    no_end_date: !editingItem?.valid_until,
    available_from: editingItem?.available_from || "00:00",
    available_to: editingItem?.available_to || "23:59",
    // ✅ FIX: use is_active directly (boolean), default true
    is_active:
      typeof editingItem?.is_active === "boolean" ? editingItem.is_active : true,
    picture: null,
    category_id: editingItem?.category?.id || "",
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

    if (files && files[0]) {
      const file = files[0];
      setFormData({ ...formData, [name]: file });
      setImagePreview(URL.createObjectURL(file));
      return;
    }

    // ✅ Map "status" dropdown to boolean is_active
    if (name === "status") {
      setFormData({ ...formData, is_active: value === "available" });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    const data = new FormData();

    // ✅ append keys properly (only send is_active, not status)
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full sm:w-[400px] max-h-screen overflow-y-auto p-6 space-y-4">
        <h2 className="text-lg font-bold">{editingItem ? "Edit" : "Add"} Product</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium">Category</label>
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
        </div>

        {/* Valid Dates */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              name="valid_from"
              value={formData.valid_from}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          {!formData.no_end_date && (
            <div className="flex-1">
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
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
          <div className="flex-1">
            <label className="block text-sm font-medium">Available From</label>
            <input
              type="time"
              name="available_from"
              value={formData.available_from}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Available To</label>
            <input
              type="time"
              name="available_to"
              value={formData.available_to}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        {/* Status (mapped to is_active) */}
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={formData.is_active ? "available" : "unavailable"}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* Picture */}
        <div>
          <label className="block text-sm font-medium">Picture</label>
          <div>
            <input
              type="file"
              id="pictureUpload"
              name="picture"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => document.getElementById("pictureUpload").click()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {imagePreview ? "Change Image" : "Upload Image"}
            </button>
          </div>
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded border"
              />
              <p className="text-xs text-gray-500">Preview</p>
            </div>
          )}
        </div>

        {/* Recipe Button */}
        <button
          onClick={() => setShowRecipe(true)}
          className="w-full bg-gray-200 p-2 rounded"
        >
          {editingItem ? "Edit Ingredients" : "Add Ingredients"}
        </button>

        {/* Actions */}
        <div className="flex justify-end gap-2 sticky bottom-0 bg-white pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
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
            setFormData({ ...formData, recipe_id: recipe.id });
          }}
        />
      )}
    </div>
  );
}
