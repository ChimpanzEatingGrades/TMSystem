import { useState, useEffect } from "react";
import { createCategory, updateCategory } from "../../api/inventoryAPI";

export default function CategoryModal({ onClose, onSave, editingCategory }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
    } else {
      setName("");
    }
  }, [editingCategory]);

  const handleSubmit = async () => {
    try {
      if (editingCategory?.id) {
        await updateCategory(editingCategory.id, { name });
      } else {
        await createCategory({ name });
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save category", err);
      alert("Failed to save category. Check console.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6 space-y-4">
        <h2 className="text-lg font-bold">
          {editingCategory ? "Edit Category" : "Add Category"}
        </h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
