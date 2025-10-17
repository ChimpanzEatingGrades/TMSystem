"use client"

import { useEffect, useState } from "react"
import {
  Search,
  Filter,
  ShoppingCart,
  Plus,
  Minus,
  MapPin,
  Utensils,
} from "lucide-react"
import { getMenuItems, getCategories, getBranches } from "../api/inventoryAPI"
import Navbar from "../components/Navbar"

export default function CustomerMenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState([])
  const [quantities, setQuantities] = useState({})

  // ✅ Load order from localStorage (includes branch)
  const [order, setOrder] = useState(() => {
    const stored = localStorage.getItem("customer_order")
    return stored
      ? JSON.parse(stored)
      : { name: "", requests: "", cart: [], branch: "", branchName: "" }
  })

  const { cart } = order

  // ✅ Persist order to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("customer_order", JSON.stringify(order))
  }, [order])

  // ✅ Load initial data (menu, categories, branches)
  useEffect(() => {
    loadData()
  }, [])

  // ✅ Once branches are loaded, auto-select saved branch if it exists
  useEffect(() => {
    if (branches.length > 0 && order.branch && !selectedBranch) {
      // Confirm that the saved branch still exists
      const exists = branches.find(
        (b) => String(b.id) === String(order.branch)
      )
      if (exists) {
        setSelectedBranch(String(order.branch))
      }
    }
  }, [branches, order.branch])

  // ✅ Refilter whenever branch/category/search changes
  useEffect(() => {
    if (selectedBranch) filterItems()
  }, [menuItems, selectedCategory, selectedBranch, searchTerm])

  const loadData = async () => {
    try {
      const [itemsRes, catsRes, branchesRes] = await Promise.all([
        getMenuItems(),
        getCategories(),
        getBranches(),
      ])

      const items = itemsRes.data?.results || itemsRes.data || []
      const cats = catsRes.data?.results || catsRes.data || []
      const brs = branchesRes.data?.results || branchesRes.data || []

      setMenuItems(Array.isArray(items) ? items : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setBranches(Array.isArray(brs) ? brs : [])

      // Init quantity defaults
      const q = {}
      items.forEach((item) => {
        q[item.id] = 1
      })
      setQuantities(q)
    } catch (err) {
      console.error("Failed to load data:", err)
    }
  }

  // ✅ Check for sufficient ingredients
  const hasSufficientIngredients = (item) => {
    if (!item.recipe || !item.recipe.items || item.recipe.items.length === 0) {
      return true; // No recipe, assume it's available
    }

    for (const recipeItem of item.recipe.items) {
      const requiredQuantity = (recipeItem.quantity / (item.recipe.yield_quantity || 1));
      const availableQuantity = recipeItem.raw_material.quantity;

      if (parseFloat(availableQuantity) < requiredQuantity) {
        return false; // Not enough of this ingredient
      }
    }

    return true; // All ingredients are in stock
  };

  // ✅ Branch-based availability
  const isAvailableForBranch = (item) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDate = now.toISOString().split("T")[0]

    if (!item.branch_availability || item.branch_availability.length === 0)
      return false

    const avail = item.branch_availability.find(
      (a) => String(a.branch) === String(selectedBranch)
    )
    if (!avail) return false

    const inDate =
      (!avail.valid_from || currentDate >= avail.valid_from) &&
      (!avail.valid_until || currentDate <= avail.valid_until)
    const inTime =
      (!avail.available_from || currentTime >= avail.available_from) &&
      (!avail.available_to || currentTime <= avail.available_to)

    const hasIngredients = hasSufficientIngredients(item);

    return avail.is_active && inDate && inTime && hasIngredients;
  }

  // ✅ Filtering logic
  const filterItems = () => {
    let filtered = [...menuItems]

    if (selectedBranch) {
      filtered = filtered.filter((item) => isAvailableForBranch(item))
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((i) => {
        const catId = i.category?.id ?? i.category
        return String(catId) === String(selectedCategory)
      })
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

  // ✅ Add to cart (keep branch info)
  const addToCart = (item) => {
    const quantity = quantities[item.id] || 1
    setOrder((prev) => {
      const existing = prev.cart.find((c) => c.id === item.id)
      let updatedCart
      if (existing) {
        updatedCart = prev.cart.map((c) =>
          c.id === item.id
            ? {
                ...c,
                quantity: c.quantity + quantity,
                totalPrice: (c.quantity + quantity) * c.unitPrice,
              }
            : c
        )
      } else {
        updatedCart = [
          ...prev.cart,
          {
            id: item.id,
            name: item.name,
            description: item.description,
            picture: item.picture,
            category: item.category?.name || "",
            // Get price from the specific branch availability
            unitPrice: parseFloat(item.branch_availability.find(a => String(a.branch) === String(selectedBranch))?.price || 0),
            quantity,
            totalPrice: parseFloat(item.branch_availability.find(a => String(a.branch) === String(selectedBranch))?.price || 0) * quantity,
          }
        ]
      }

      const branchName =
        branches.find((b) => String(b.id) === String(selectedBranch))?.name || ""

      return {
        ...prev,
        cart: updatedCart,
        branch: selectedBranch,
        branchName,
      }
    })
  }

  // ✅ Handle branch change (clears cart if needed)
  const handleBranchChange = (branchId) => {
    if (branchId !== order.branch && cart.length > 0) {
      if (!window.confirm("Changing branch will clear your cart. Continue?"))
        return
    }

    const branchName =
      branches.find((b) => String(b.id) === String(branchId))?.name || ""

    setSelectedBranch(branchId)
    setOrder((prev) => ({
      ...prev,
      cart: [],
      branch: branchId,
      branchName,
    }))
  }

  // ✅ Empty state before picking branch
  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <MapPin size={64} className="text-yellow-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Pick a branch to start browsing
          </h2>
          <p className="text-gray-500 mb-6">
            Choose your nearest branch to see available menu items.
          </p>

          <select
            value={selectedBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full max-w-xs px-4 py-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={String(branch.id)}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  // ✅ Regular menu view
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Our Menu</h1>
            <p className="text-gray-600">
              Showing items available at{" "}
              <span className="font-semibold text-yellow-600">
                {branches.find(
                  (b) => String(b.id) === String(selectedBranch)
                )?.name || "Branch"}
              </span>
            </p>
          </div>

          <a
            href="/shopping-cart"
            className="relative p-2 bg-yellow-400 rounded-full hover:bg-yellow-500"
          >
            <ShoppingCart className="text-black" size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1">
                {cart.reduce((a, c) => a + c.quantity, 0)}
              </span>
            )}
          </a>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Selector */}
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={selectedBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="">Pick a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Utensils size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No available items right now
            </h3>
            <p className="text-gray-500">
              Please check again later or pick another branch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 flex flex-col"
              >
                {item.picture && (
                  <img
                    src={item.picture}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <h2 className="text-xl font-semibold mb-1">{item.name}</h2>
                <p className="text-gray-600 text-sm flex-1">
                  {item.description}
                </p>
                <div className="mt-2 font-bold text-lg text-yellow-600"> 
                  ₱{item.branch_availability.find(a => String(a.branch) === String(selectedBranch))?.price || 'N/A'}
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-2">{quantities[item.id] || 1}</span>
                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="flex-1 text-black font-semibold py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500"
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
