const API_BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000"

class MenuAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`
    console.log("[v0] Making API request to:", url)

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
        console.error("[v0] API request failed:", {
          url,
          status: response.status,
          statusText: response.statusText,
          endpoint,
        })
        throw new Error(`HTTP error! status: ${response.status} for ${endpoint}`)
      }

      const data = await response.json()
      console.log("[v0] API request successful:", endpoint, data)
      return data
    } catch (error) {
      console.error("API request failed:", error)
      if (error.message.includes("404")) {
        console.error("[v0] 404 Error - Check if Django server is running on port 8000 and endpoints exist")
      }
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
