"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Filter, Grid, List } from "lucide-react"
import { getMenuItems, getCategories, deleteMenuItem } from "../../api/inventoryAPI"
import MenuItemModal from "./MenuItemModal"
import MenuItemCard from "./MenuItemCard"
import Navbar from "../Navbar"

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [menuItems, selectedCategory, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsRes, categoriesRes] = await Promise.all([getMenuItems(), getCategories()])

      const items = itemsRes.data?.results || itemsRes.data || []
      const cats = categoriesRes.data?.results || categoriesRes.data || []

      setMenuItems(Array.isArray(items) ? items : [])
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = [...menuItems]

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category?.id === Number.parseInt(selectedCategory))
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5)
        const currentDate = now.toISOString().split("T")[0]

        const isActive = item.is_active
        const isInDateRange =
          (!item.valid_from || currentDate >= item.valid_from) && (!item.valid_until || currentDate <= item.valid_until)
        const isInTimeRange =
          (!item.available_from || currentTime >= item.available_from) &&
          (!item.available_to || currentTime <= item.available_to)

        const isAvailable = isActive && isInDateRange && isInTimeRange

        return statusFilter === "available" ? isAvailable : !isAvailable
      })
    }

    setFilteredItems(filtered)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return

    try {
      await deleteMenuItem(id)
      await loadData()
    } catch (error) {
      console.error("Failed to delete item:", error)
      alert("Failed to delete menu item")
    }
  }

  const handleSave = async () => {
    setShowModal(false)
    setEditingItem(null)
    await loadData()
  }

  const getItemStatus = (item) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDate = now.toISOString().split("T")[0]

    const isActive = item.is_active
    const isInDateRange =
      (!item.valid_from || currentDate >= item.valid_from) && (!item.valid_until || currentDate <= item.valid_until)
    const isInTimeRange =
      (!item.available_from || currentTime >= item.available_from) &&
      (!item.available_to || currentTime <= item.available_to)

    return {
      isActive,
      isInDateRange,
      isInTimeRange,
      isAvailable: isActive && isInDateRange && isInTimeRange,
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC601]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Menu Items</h1>
            <p className="text-gray-600">Manage your restaurant menu items and categories</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null)
              setShowModal(true)
            }}
            className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg mt-4 md:mt-0"
          >
            <Plus size={20} />
            Add Menu Item
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available Now</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-white text-black shadow-sm" : "text-gray-600"
                }`}
              >
                <Grid size={16} />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-white text-black shadow-sm" : "text-gray-600"
                }`}
              >
                <List size={16} />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-black">{filteredItems.length}</div>
            <div className="text-gray-600 text-sm">Total Items</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredItems.filter((item) => getItemStatus(item).isAvailable).length}
            </div>
            <div className="text-gray-600 text-sm">Available Now</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-[#DD7373]">
              {filteredItems.filter((item) => !getItemStatus(item).isAvailable).length}
            </div>
            <div className="text-gray-600 text-sm">Unavailable</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-black">{categories.length}</div>
            <div className="text-gray-600 text-sm">Categories</div>
          </div>
        </div>

        {/* Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No menu items found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "Get started by adding your first menu item"}
            </p>
            <button
              onClick={() => {
                setEditingItem(null)
                setShowModal(true)
              }}
              className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Menu Item
            </button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                status={getItemStatus(item)}
                onEdit={(item) => {
                  setEditingItem(item)
                  setShowModal(true)
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <MenuItemModal onClose={() => setShowModal(false)} onSave={handleSave} editingItem={editingItem} />}
    </div>
  )
}
