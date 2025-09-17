import { useEffect, useState } from "react";
import { getRawMaterials, createRecipe, updateRecipe } from "../../api/inventoryApi";

export default function RecipeModal({ onClose, existingRecipe, onSave }) {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selected, setSelected] = useState(existingRecipe?.items || []);
  const [recipeName, setRecipeName] = useState(existingRecipe?.name || "");
  const [description, setDescription] = useState(existingRecipe?.description || "");
  const [yieldQty, setYieldQty] = useState(existingRecipe?.yield_quantity || 1);
  const [yieldUom, setYieldUom] = useState(existingRecipe?.yield_uom || "pcs");

  useEffect(() => {
    getRawMaterials().then(data => setRawMaterials(data)); // ✅ no `.data`
  }, []);

  const handleAdd = (material) => {
    if (!selected.find(item => item.raw_material === material.id)) {
      setSelected([...selected, { raw_material: material.id, quantity: 1 }]);
    }
  };

  const handleChangeQty = (id, qty) => {
    setSelected(
      selected.map(item =>
        item.raw_material === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleSubmit = async () => {
    const payload = {
      name: recipeName,
      description,
      yield_quantity: yieldQty,
      yield_uom: yieldUom,
      items: selected
    };

    let recipe;
    if (existingRecipe?.id) {
      recipe = await updateRecipe(existingRecipe.id, payload); // ✅ no `.data`
    } else {
      recipe = await createRecipe(payload); // ✅ no `.data`
    }

    onSave(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg w-[400px] p-6 space-y-4">
        <h2 className="text-lg font-bold">Edit Ingredients</h2>

        <input
          type="text"
          value={recipeName}
          onChange={e => setRecipeName(e.target.value)}
          placeholder="Recipe Name"
          className="w-full border p-2 rounded"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full border p-2 rounded"
        />

        <div className="flex gap-2">
          <input
            type="number"
            value={yieldQty}
            onChange={e => setYieldQty(e.target.value)}
            className="border p-2 rounded w-20"
          />
          <input
            type="text"
            value={yieldUom}
            onChange={e => setYieldUom(e.target.value)}
            className="border p-2 rounded w-20"
            placeholder="UOM"
          />
        </div>

        <div className="space-y-2">
          {selected.map(item => {
            const material = rawMaterials.find(m => m.id === item.raw_material);
            return (
              <div key={item.raw_material} className="flex justify-between items-center border p-2 rounded">
                <span>{material?.name || "Unknown"}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={e => handleChangeQty(item.raw_material, e.target.value)}
                  className="w-16 border p-1 rounded"
                />
              </div>
            );
          })}
        </div>

        <h3 className="font-medium mt-4">Add Ingredient</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {rawMaterials.map(material => (
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
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Close</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
