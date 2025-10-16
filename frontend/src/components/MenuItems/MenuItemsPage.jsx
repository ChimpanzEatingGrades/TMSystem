"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Filter, Grid, List, MapPin } from "lucide-react"
import {
  getMenuItems,
  getCategories,
  getBranches,
  deleteMenuItem,
  createBranch,
  updateBranch,
  deleteBranch,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../api/inventoryAPI"
import MenuItemModal from "./MenuItemModal"
import MenuItemCard from "./MenuItemCard"
import Navbar from "../Navbar"
import CategoryModal from "./CategoryModal"

function BranchesModal({ open, onClose }) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBranch, setNewBranch] = useState("")
  const [editingBranchId, setEditingBranchId] = useState(null)
  const [editingBranchName, setEditingBranchName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) loadBranches()
    // eslint-disable-next-line
  }, [open])

  const loadBranches = async () => {
    setLoading(true)
    try {
      const res = await getBranches()
      setBranches(res.data?.results || res.data || [])
    } catch (err) {
      setError("Failed to load branches")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newBranch.trim()) return
    try {
      await createBranch({ name: newBranch })
      setNewBranch("")
      loadBranches()
    } catch (err) {
      setError("Failed to create branch")
    }
  }

  const handleEdit = (branch) => {
    setEditingBranchId(branch.id)
    setEditingBranchName(branch.name)
  }

  const handleUpdate = async (id) => {
    if (!editingBranchName.trim()) return
    try {
      await updateBranch(id, { name: editingBranchName })
      setEditingBranchId(null)
      setEditingBranchName("")
      loadBranches()
    } catch (err) {
      setError("Failed to update branch")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this branch?")) return
    try {
      await deleteBranch(id)
      loadBranches()
    } catch (err) {
      setError("Failed to delete branch")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin size={20} /> Branches
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl font-bold">&times;</button>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="mb-4">
          <input
            type="text"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            placeholder="New branch name"
            className="border rounded px-3 py-2 w-2/3 mr-2"
          />
          <button
            onClick={handleAdd}
            className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded"
          >
            <Plus size={16} className="inline" /> Add
          </button>
        </div>
        <ul className="divide-y">
          {loading ? (
            <li className="py-4 text-center text-gray-500">Loading...</li>
          ) : branches.length === 0 ? (
            <li className="py-4 text-center text-gray-400">No branches yet</li>
          ) : (
            branches.map((branch) => (
              <li key={branch.id} className="flex items-center justify-between py-2">
                {editingBranchId === branch.id ? (
                  <>
                    <input
                      value={editingBranchName}
                      onChange={(e) => setEditingBranchName(e.target.value)}
                      className="border rounded px-2 py-1 flex-1 mr-2"
                    />
                    <button
                      onClick={() => handleUpdate(branch.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingBranchId(null)}
                      className="bg-gray-300 text-black px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span>{branch.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="text-blue-600 hover:underline px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-600 hover:underline px-2"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [branches, setBranches] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [showBranchesModal, setShowBranchesModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryError, setCategoryError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterItems()
  }, [menuItems, selectedCategory, selectedBranch, searchTerm, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsRes, categoriesRes, branchesRes] = await Promise.all([
        getMenuItems(),
        getCategories(),
        getBranches(),
      ])
      const items = itemsRes.data?.results || itemsRes.data || []
      const cats = categoriesRes.data?.results || categoriesRes.data || []
      const brs = branchesRes.data?.results || branchesRes.data || []
      setMenuItems(Array.isArray(items) ? items : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setBranches(Array.isArray(brs) ? brs : [])
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
      filtered = filtered.filter((item) => {
        const catId = item.category?.id ?? item.category_id ?? item.category
        return String(catId) === String(selectedCategory)
      })
    }

    // Branch filter
    if (selectedBranch !== "all") {
      filtered = filtered.filter((item) => {
        // Show item if it has any branch_availability for this branch
        return (item.branch_availability || []).some(
          (a) => String(a.branch) === String(selectedBranch)
        )
      })
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter (per selected branch if filtered, else first branch)
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5)
        const currentDate = now.toISOString().split("T")[0]
        let availabilities = item.branch_availability || []
        if (selectedBranch !== "all") {
          availabilities = availabilities.filter(
            (a) => String(a.branch) === String(selectedBranch)
          )
        }
        const availability = availabilities[0]
        if (!availability) return statusFilter === "unavailable"
        const isActive = availability.is_active
        const isInDateRange =
          (!availability.valid_from || currentDate >= availability.valid_from) &&
          (!availability.valid_until || currentDate <= availability.valid_until)
        const isInTimeRange =
          (!availability.available_from || currentTime >= availability.available_from) &&
          (!availability.available_to || currentTime <= availability.available_to)
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

  // Show status for the selected branch (or first branch if not filtered)
  const getItemStatus = (item) => {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDate = now.toISOString().split("T")[0]
    let availabilities = item.branch_availability || []
    if (selectedBranch !== "all") {
      availabilities = availabilities.filter(
        (a) => String(a.branch) === String(selectedBranch)
      )
    }
    const availability = availabilities[0]
    if (!availability) {
      return {
        isActive: false,
        isInDateRange: false,
        isInTimeRange: false,
        isAvailable: false,
        branchAvailability: null,
      }
    }
    const isActive = availability.is_active
    const isInDateRange =
      (!availability.valid_from || currentDate >= availability.valid_from) &&
      (!availability.valid_until || currentDate <= availability.valid_until)
    const isInTimeRange =
      (!availability.available_from || currentTime >= availability.available_from) &&
      (!availability.available_to || currentTime <= availability.available_to)
    return {
      isActive,
      isInDateRange,
      isInTimeRange,
      isAvailable: isActive && isInDateRange && isInTimeRange,
      branchAvailability: availability,
    }
  }

  // CATEGORY CRUD HANDLERS
  const handleCategorySave = async (cat) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, cat)
    } else {
      await createCategory(cat)
    }
    setEditingCategory(null)
    setShowCategoryModal(false)
    await loadData()
  }

  const handleCategoryEdit = (cat) => {
    setEditingCategory(cat)
    setShowCategoryModal(true)
  }

  const handleCategoryDelete = async (cat) => {
    if (!window.confirm("Delete this category?")) return
    try {
      await deleteCategory(cat.id)
      await loadData()
    } catch (err) {
      setCategoryError("Failed to delete category")
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
            <p className="text-gray-600">Manage your restaurant menu items, categories, and branch availability</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBranchesModal(true)}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow"
            >
              <MapPin size={18} /> Branches
            </button>
            <button
              onClick={() => {
                setEditingItem(null)
                setShowModal(true)
              }}
              className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* Category Management */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">Categories:</span>
            <button
              onClick={() => { setEditingCategory(null); setShowCategoryModal(true) }}
              className="bg-[#FFC601] hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded"
            >
              + Add Category
            </button>
          </div>
          {categoryError && <div className="text-red-600 mb-2">{categoryError}</div>}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded">
                <span>{cat.name}</span>
                <button onClick={() => handleCategoryEdit(cat)} className="text-blue-600 hover:underline text-xs">Edit</button>
                <button onClick={() => handleCategoryDelete(cat)} className="text-red-600 hover:underline text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={String(branch.id)}>
                    {branch.name}
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
            <div className="text-gray-600 text-sm">Available Now{selectedBranch !== "all" && ` (${branches.find(b => String(b.id) === String(selectedBranch))?.name || ""})`}</div>
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
              {searchTerm || selectedCategory !== "all" || selectedBranch !== "all" || statusFilter !== "all"
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
                // Optionally pass selectedBranch for further customization
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && <MenuItemModal onClose={() => setShowModal(false)} onSave={handleSave} editingItem={editingItem} />}
      {showBranchesModal && <BranchesModal open={showBranchesModal} onClose={() => setShowBranchesModal(false)} />}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null) }}
          onSave={handleCategorySave}
          editingCategory={editingCategory}
        />
      )}
    </div>
  )
}
