import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMenuItem, createMenuItem, updateMenuItem, getCategories } from "../api/menu";

export default function MenuFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    picture: null,
    is_active: true,
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
    if (isEdit) {
      getMenuItem(id).then(res => {
        const { name, price, description, category, is_active } = res.data;
        setForm({
          name,
          price,
          description,
          category_id: category?.id || "",
          picture: null,
          is_active,
        });
      });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in form) {
      if (form[key] !== null) data.append(key, form[key]);
    }

    if (isEdit) {
      await updateMenuItem(id, data);
    } else {
      await createMenuItem(data);
    }
    navigate("/menu");
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{isEdit ? "Edit Item" : "New Item"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Price"
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          required
        />
        <textarea
          className="w-full border rounded p-2"
          placeholder="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
        />
        <select
          name="category_id"
          value={form.category_id}
          onChange={handleChange}
          className="w-full border rounded p-2"
        >
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="file" name="picture" onChange={handleChange} />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <span>Active</span>
        </label>
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          {isEdit ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
