"use client"

import { useEffect, useState } from "react"
import { Search, Filter, ShoppingCart, Plus, Minus } from "lucide-react"
import { getMenuItems, getCategories } from "../api/inventoryAPI"
import Navbar from "../components/Navbar"

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState([])
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("customer_cart")
    return stored ? JSON.parse(stored) : []
  })
  const [quantities, setQuantities] = useState({}) // store quantity per itemId

  // Load items + categories
  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [menuItems, selectedCategory, searchTerm])

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem("customer_cart", JSON.stringify(cart))
  }, [cart])

  const loadData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([getMenuItems(), getCategories()])
      const items = itemsRes.data?.results || itemsRes.data || []
      const cats = catsRes.data?.results || catsRes.data || []
      setMenuItems(Array.isArray(items) ? items : [])
      setCategories(Array.isArray(cats) ? cats : [])

      // initialize quantities
      const initialQuantities = {}
      items.forEach((item) => {
        initialQuantities[item.id] = 1
      })
      setQuantities(initialQuantities)
    } catch (err) {
      console.error("Failed to load menu data:", err)
    }
  }

  const isAvailable = (item) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDate = now.toISOString().split("T")[0]

    const inDate =
      (!item.valid_from || currentDate >= item.valid_from) &&
      (!item.valid_until || currentDate <= item.valid_until)

    const inTime =
      (!item.available_from || currentTime >= item.available_from) &&
      (!item.available_to || currentTime <= item.available_to)

    return item.is_active && inDate && inTime
  }

  const filterItems = () => {
    let filtered = [...menuItems].filter((item) => isAvailable(item))

    if (selectedCategory !== "all") {
      filtered = filtered.filter((i) => i.category?.id === Number(selectedCategory))
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }

  const changeQuantity = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta),
    }))
  }

  const addToCart = (item) => {
    const quantity = quantities[item.id] || 1
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) {
        return prev.map((c) =>
          c.id === item.id
            ? {
                ...c,
                quantity: c.quantity + quantity,
                totalPrice: (c.quantity + quantity) * c.unitPrice,
              }
            : c
        )
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          description: item.description,
          picture: item.picture,
          category: item.category?.name || "",
          unitPrice: parseFloat(item.price),
          quantity,
          totalPrice: parseFloat(item.price) * quantity,
        },
      ]
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">Our Menu</h1>
          <button className="relative p-2 bg-yellow-400 rounded-full hover:bg-yellow-500">
            <ShoppingCart className="text-black" size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center text-gray-500">No available menu items.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col">
                {item.picture && (
                  <img
                    src={item.picture}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h2 className="text-xl font-semibold">{item.name}</h2>
                <p className="text-gray-600 text-sm flex-1">{item.description}</p>
                <div className="mt-2 font-bold text-lg text-yellow-600">₱{item.price}</div>

                {/* Quantity + Add */}
                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      className="p-2 bg-gray-200 rounded-full"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-2">{quantities[item.id] || 1}</span>
                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      className="p-2 bg-gray-200 rounded-full"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
