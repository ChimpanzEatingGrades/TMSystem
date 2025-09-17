"use client"

import { useState, useEffect } from "react"
import { MenuItemCard } from "../components/menu-item-card"
import { MenuItemModal } from "../components/menu-item-modal"
import { RecipeModal } from "../components/recipe-modal"
import menuAPI from "../lib/api"

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false)
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [selectedMenuItemForRecipe, setSelectedMenuItemForRecipe] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [menuItemsData, categoriesData] = await Promise.all([menuAPI.getMenuItems(), menuAPI.getCategories()])

      setMenuItems(menuItemsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMenuItem = () => {
    setSelectedMenuItem(null)
    setIsMenuItemModalOpen(true)
  }

  const handleEditMenuItem = (item) => {
    setSelectedMenuItem(item)
    setIsMenuItemModalOpen(true)
  }

  const handleEditRecipe = (item) => {
    setSelectedMenuItemForRecipe(item)
    setIsRecipeModalOpen(true)
  }

  const handleMenuItemSaved = () => {
    fetchData()
    setIsMenuItemModalOpen(false)
    setSelectedMenuItem(null)
  }

  const handleRecipeSaved = () => {
    fetchData()
    setIsRecipeModalOpen(false)
    setSelectedMenuItemForRecipe(null)
  }

  const groupedItems = categories.reduce((acc, category) => {
    acc[category.name] = menuItems.filter((item) => item.category?.id === category.id)
    return acc
  }, {})

  // Add uncategorized items
  const uncategorizedItems = menuItems.filter((item) => !item.category)
  if (uncategorizedItems.length > 0) {
    groupedItems["Uncategorized"] = uncategorizedItems
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading menu items...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant menu items and recipes</p>
        </div>
        <button
          onClick={handleAddMenuItem}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span className="text-lg">+</span>
          Add Menu Item
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedItems).map(([categoryName, items]) => (
          <div key={categoryName}>
            <h2 className="text-2xl font-semibold mb-4">{categoryName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <MenuItemCard key={item.id} item={item} onEdit={handleEditMenuItem} onEditRecipe={handleEditRecipe} />
              ))}
            </div>
            {items.length === 0 && <div className="text-center py-8 text-gray-500">No items in this category</div>}
          </div>
        ))}
      </div>

      {Object.keys(groupedItems).length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">No menu items yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first menu item</p>
          <button
            onClick={handleAddMenuItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Menu Item
          </button>
        </div>
      )}

      <MenuItemModal
        isOpen={isMenuItemModalOpen}
        onClose={() => setIsMenuItemModalOpen(false)}
        onSave={handleMenuItemSaved}
        menuItem={selectedMenuItem}
        categories={categories}
      />

      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        onSave={handleRecipeSaved}
        menuItem={selectedMenuItemForRecipe}
      />
    </div>
  )
}
