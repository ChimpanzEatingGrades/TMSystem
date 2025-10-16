"use client";

import { useState, useEffect } from "react";
import { X, Upload, Tag, ImageIcon, MapPin } from "lucide-react";
import {
  createMenuItem,
  updateMenuItem,
  getCategories,
  getBranches,
  createMenuItemBranchAvailability,
  updateMenuItemBranchAvailability,
  deleteMenuItemBranchAvailability,
} from "../../api/inventoryAPI";
import RecipeModal from "./RecipeModal";

export default function MenuItemModal({ onClose, onSave, editingItem }) {
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchFields, setBranchFields] = useState([]);
  const [imagePreview, setImagePreview] = useState(editingItem?.picture || null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ use `category` instead of `category_id`
  const [formData, setFormData] = useState({
    name: editingItem?.name || "",
    description: editingItem?.description || "",
    price: editingItem?.price || "",
    picture: null,
    category: editingItem?.category?.id || editingItem?.category || "",
  });

  useEffect(() => {
    loadCategories();
    loadBranches();
  }, [editingItem]);

  useEffect(() => {
    if (branches.length > 0) {
      setBranchFields(
        branches.map((branch) => {
          const found = editingItem?.branch_availability?.find(
            (a) => a.branch === branch.id
          );
          return {
            branch_id: branch.id,
            branch_name: branch.name,
            id: found?.id || null,
            valid_from: found?.valid_from || "",
            valid_until: found?.valid_until || "",
            available_from: found?.available_from || "00:00",
            available_to: found?.available_to || "23:59",
            is_active:
              typeof found?.is_active === "boolean" ? found.is_active : false,
          };
        })
      );
    }
  }, [branches, editingItem]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      const data = res.data?.results ?? res.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const loadBranches = async () => {
    try {
      const res = await getBranches();
      const data = res.data?.results ?? res.data;
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load branches", err);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price || formData.price <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.category) newErrors.category = "Category is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      setImagePreview(URL.createObjectURL(files[0]));
      return;
    }
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? e.target.checked : value,
    });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleBranchFieldChange = (idx, field, value) => {
    setBranchFields((prev) =>
      prev.map((b, i) =>
        i === idx
          ? {
              ...b,
              [field]:
                field === "is_active"
                  ? value === "true" || value === true
                  : value,
            }
          : b
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") data.append(key, value);
    });

    try {
      let menuItemId = editingItem?.id;
      let res;
      if (editingItem) {
        res = await updateMenuItem(editingItem.id, data);
        menuItemId = res.data?.id || editingItem.id;
      } else {
        res = await createMenuItem(data);
        menuItemId = res.data?.id || res.id;
      }

      menuItemId = Number(menuItemId);
      if (!menuItemId || isNaN(menuItemId)) {
        throw new Error("Menu item ID not found");
      }

      // ✅ Handle Branch Availabilities
      for (const branch of branchFields) {
        const payload = {
          menu_item: menuItemId,
          branch: branch.branch_id,
          valid_from: branch.valid_from || null,
          valid_until: branch.valid_until || null,
          available_from: branch.available_from || null,
          available_to: branch.available_to || null,
          is_active: branch.is_active,
        };

        if (branch.id) {
          if (
            branch.is_active ||
            branch.valid_from ||
            branch.valid_until ||
            branch.available_from ||
            branch.available_to
          ) {
            await updateMenuItemBranchAvailability(branch.id, payload);
          } else {
            await deleteMenuItemBranchAvailability(branch.id);
          }
        } else {
          if (
            branch.is_active ||
            branch.valid_from ||
            branch.valid_until ||
            branch.available_from ||
            branch.available_to
          ) {
            await createMenuItemBranchAvailability(payload);
          }
        }
      }

      onSave();
    } catch (err) {
      console.error("Save failed", err);
      setErrors({ submit: "Failed to save menu item. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <Tag size={20} />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FFC601] ${
                      errors.name ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FFC601] ${
                      errors.price ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-xs mt-1">{errors.price}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC601]"
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FFC601] ${
                    errors.category ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Product Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <ImageIcon size={20} /> Product Image
              </h3>
              <div className="flex items-start gap-4">
                <div className="flex-1">
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
                    onClick={() =>
                      document.getElementById("pictureUpload").click()
                    }
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FFC601] hover:bg-yellow-50 transition"
                  >
                    <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm text-gray-600">
                      {imagePreview ? "Change Image" : "Click to upload image"}
                    </p>
                  </button>
                </div>
                {imagePreview && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Branch Availability */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <MapPin size={20} /> Branch Availability
              </h3>
              {branchFields.length === 0 ? (
                <div className="text-gray-500">No branches found.</div>
              ) : (
                branchFields.map((branch, idx) => (
                  <div
                    key={branch.branch_id}
                    className="border rounded-lg p-4 mb-2"
                  >
                    <div className="font-medium mb-2">{branch.branch_name}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Valid From
                        </label>
                        <input
                          type="date"
                          value={branch.valid_from}
                          onChange={(e) =>
                            handleBranchFieldChange(
                              idx,
                              "valid_from",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Valid Until
                        </label>
                        <input
                          type="date"
                          value={branch.valid_until}
                          onChange={(e) =>
                            handleBranchFieldChange(
                              idx,
                              "valid_until",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Status
                        </label>
                        <select
                          value={branch.is_active ? "true" : "false"}
                          onChange={(e) =>
                            handleBranchFieldChange(
                              idx,
                              "is_active",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Available From (Time)
                        </label>
                        <input
                          type="time"
                          value={branch.available_from}
                          onChange={(e) =>
                            handleBranchFieldChange(
                              idx,
                              "available_from",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Available To (Time)
                        </label>
                        <input
                          type="time"
                          value={branch.available_to}
                          onChange={(e) =>
                            handleBranchFieldChange(
                              idx,
                              "available_to",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Recipe Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowRecipe(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {editingItem ? "Edit Recipe & Ingredients" : "Add Recipe & Ingredients"}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Saving...
                </>
              ) : (
                <>Save Menu Item</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Recipe Modal */}
      {showRecipe && (
        <RecipeModal
          onClose={() => setShowRecipe(false)}
          existingRecipe={editingItem?.recipe}
          onSave={(recipe) => {
            setFormData({ ...formData, recipe_id: recipe.id })
            setShowRecipe(false)
          }}
          menuItemId={editingItem?.id}
        />
      )}
    </div>
  );
}
