import { useEffect, useState } from "react";
import { getRawMaterials, createRecipe, updateRecipe } from "../../api/inventoryApi";

export default function RecipeModal({ onClose, existingRecipe, onSave, menuItemId }) {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selected, setSelected] = useState([]);
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [yieldQty, setYieldQty] = useState(1);
  const [yieldUom, setYieldUom] = useState("pcs");

  // Load raw materials once
  useEffect(() => {
    const loadRawMaterials = async () => {
      try {
        const res = await getRawMaterials();
        const data = res.data?.results ?? res.data;
        setRawMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load raw materials", err);
        setRawMaterials([]);
      }
    };
    loadRawMaterials();
  }, []);

  // Initialize modal state
  useEffect(() => {
    setRecipeName(existingRecipe?.name || "");
    setDescription(existingRecipe?.description || "");
    setYieldQty(existingRecipe?.yield_quantity || 1);
    setYieldUom(existingRecipe?.yield_uom || "pcs");

    const initialSelected = (existingRecipe?.items ?? []).map((item) => ({
      raw_material: item.raw_material?.id ?? item.raw_material ?? item.id,
      quantity: item.quantity ?? 1,
    }));
    setSelected(initialSelected);
  }, [existingRecipe]);

  const handleAdd = (material) => {
    if (!selected.find((item) => item.raw_material === material.id)) {
      setSelected([...selected, { raw_material: material.id, quantity: 1 }]);
    }
  };

  const handleChangeQty = (id, qty) => {
    setSelected(selected.map((item) =>
      item.raw_material === id ? { ...item, quantity: Number(qty) } : item
    ));
  };

  const handleDelete = (id) => {
    setSelected(selected.filter((item) => item.raw_material !== id));
  };

  const handleSubmit = async () => {
    const payload = {
      name: recipeName,
      description,
      yield_quantity: yieldQty,
      yield_uom: yieldUom,
      items: selected,
      menu_item: menuItemId,
    };

    try {
      let recipe;
      if (existingRecipe?.id) {
        const res = await updateRecipe(existingRecipe.id, payload);
        recipe = res.data ?? res;
      } else {
        const res = await createRecipe(payload);
        recipe = res.data ?? res;
      }

      onSave(recipe);
      onClose();
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save recipe. See console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold">Edit Recipe</h2>

        <input
          type="text"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
          placeholder="Recipe Name"
          className="w-full border p-2 rounded"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full border p-2 rounded"
        />

        <div className="flex gap-2">
          <input
            type="number"
            value={yieldQty}
            onChange={(e) => setYieldQty(Number(e.target.value))}
            className="border p-2 rounded w-20"
          />
          <input
            type="text"
            value={yieldUom}
            onChange={(e) => setYieldUom(e.target.value)}
            className="border p-2 rounded w-20"
            placeholder="UOM"
          />
        </div>

        {/* Selected Ingredients */}
        <div className="space-y-2 mt-2">
          {selected.map((item) => {
            const material = rawMaterials.find((m) => m.id === item.raw_material);
            return (
              <div
                key={item.raw_material}
                className="flex justify-between items-center border p-2 rounded"
              >
                <span>{material?.name || "Unknown"}</span>
                <input
                  type="number"
                  value={item.quantity}
                  min={0}
                  onChange={(e) => handleChangeQty(item.raw_material, e.target.value)}
                  className="w-16 border p-1 rounded"
                />
                <button
                  onClick={() => handleDelete(item.raw_material)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            );
          })}
          {selected.length === 0 && (
            <p className="text-gray-500 text-sm">No ingredients added yet.</p>
          )}
        </div>

        <h3 className="font-medium mt-4">Add Ingredient</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {rawMaterials.map((material) => (
            <button
              key={material.id}
              onClick={() => handleAdd(material)}
              className="w-full text-left p-2 border rounded hover:bg-gray-100"
            >
              {material.name}
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Close
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
