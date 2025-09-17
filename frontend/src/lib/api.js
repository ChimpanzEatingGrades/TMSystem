const API_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:5173"

class MenuAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    // Handle FormData (for file uploads)
    if (options.body instanceof FormData) {
      delete config.headers["Content-Type"]
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Menu Items
  async getMenuItems() {
    return this.request("/menu-items/")
  }

  async getMenuItem(id) {
    return this.request(`/menu-items/${id}/`)
  }

  async createMenuItem(formData) {
    return this.request("/menu-items/", {
      method: "POST",
      body: formData,
    })
  }

  async updateMenuItem(id, formData) {
    return this.request(`/menu-items/${id}/`, {
      method: "PUT",
      body: formData,
    })
  }

  async deleteMenuItem(id) {
    return this.request(`/menu-items/${id}/`, {
      method: "DELETE",
    })
  }

  // Categories
  async getCategories() {
    return this.request("/categories/")
  }

  async createCategory(data) {
    return this.request("/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Recipes
  async getRecipes() {
    return this.request("/recipes/")
  }

  async getRecipe(id) {
    return this.request(`/recipes/${id}/`)
  }

  async createRecipe(data) {
    return this.request("/recipes/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateRecipe(id, data) {
    return this.request(`/recipes/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteRecipe(id) {
    return this.request(`/recipes/${id}/`, {
      method: "DELETE",
    })
  }

  // Raw Materials
  async getRawMaterials() {
    return this.request("/raw-materials/")
  }

  async createRawMaterial(data) {
    return this.request("/raw-materials/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

const menuAPI = new MenuAPI()
export default menuAPI
