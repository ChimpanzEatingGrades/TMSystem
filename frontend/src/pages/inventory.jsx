"use client"
import { useState, useEffect } from "react"
import api from "../api"   // this already injects Bearer token

export default function Inventory() {
  const [materials, setMaterials] = useState([])
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg") // default unit
  const [error, setError] = useState("")

  // Preset units
  const units = ["kg", "g", "pcs", "liters"]

  // Load materials on mount
  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      const res = await api.get("/inventory/rawmaterials/") // token auto-included
      setMaterials(res.data)
    } catch (err) {
      console.error("Failed to fetch materials", err)
      setError("Could not fetch materials. Please login first.")
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/inventory/rawmaterials/", {
        name,
        quantity,
        unit,
      })
      setMaterials([...materials, res.data]) // update instantly
      setName("")
      setQuantity("")
      setUnit("kg")
      setError("")
    } catch (err) {
      console.error("Failed to add material", err)
      setError("Could not add material. Are you logged in?")
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/inventory/rawmaterials/${id}/`)
      setMaterials(materials.filter((m) => m.id !== id))
    } catch (err) {
      console.error("Delete failed", err)
      setError("Could not delete material.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Inventory</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Add Material Form */}
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border p-2 rounded-md"
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-32 border p-2 rounded-md"
          required
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-32 border p-2 rounded-md"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-[#FFC601] hover:bg-yellow-500 text-black px-4 py-2 rounded-md"
        >
          Add
        </button>
      </form>

      {/* Materials Table */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Quantity</th>
            <th className="p-2 border">Unit</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((mat) => (
            <tr key={mat.id} className="text-center">
              <td className="p-2 border">{mat.name}</td>
              <td className="p-2 border">{mat.quantity}</td>
              <td className="p-2 border">{mat.unit}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleDelete(mat.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {materials.length === 0 && !error && (
        <p className="text-center mt-4 text-gray-500">No materials found.</p>
      )}
    </div>
  )
}
