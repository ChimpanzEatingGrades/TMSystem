"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Menu, X, ChefHat, User, LogOut, Home, Info } from "lucide-react"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN)
    setIsAuthenticated(!!token)
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
    setIsAuthenticated(false)
    navigate("/")
    setIsOpen(false)
  }

  const handleNavigation = (path) => {
    if (path === "/tasks" && !isAuthenticated) {
      navigate("/login")
    } else {
      navigate(path)
    }
    setIsOpen(false)
  }

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true
    if (path !== "/" && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 transition-colors duration-200"
            >
              <ChefHat size={28} />
              <span className="text-xl font-bold">Kapitan Sisig</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => handleNavigation("/")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  isActive("/") ? "bg-amber-500/20 text-amber-300" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Home size={16} />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleNavigation("/about")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  isActive("/about")
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Info size={16} />
                <span>About</span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => handleNavigation("/tasks")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                    isActive("/tasks")
                      ? "bg-blue-500/20 text-blue-300"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <User size={16} />
                  <span>Tasks</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleNavigation("/login")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation("/register")}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800 border-t border-gray-700">
            <button
              onClick={() => handleNavigation("/")}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 flex items-center space-x-2 ${
                isActive("/") ? "bg-amber-500/20 text-amber-300" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <Home size={16} />
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavigation("/about")}
              className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 flex items-center space-x-2 ${
                isActive("/about")
                  ? "bg-amber-500/20 text-amber-300"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <Info size={16} />
              <span>About</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => handleNavigation("/tasks")}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 flex items-center space-x-2 ${
                  isActive("/tasks")
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <User size={16} />
                <span>Tasks</span>
              </button>
            )}

            <div className="border-t border-gray-700 pt-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="block px-3 py-2 rounded-md text-base font-medium w-full text-left bg-red-600 hover:bg-red-700 text-white transition-colors duration-200 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation("/login")}
                    className="block px-3 py-2 rounded-md text-base font-medium w-full text-left bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNavigation("/register")}
                    className="block px-3 py-2 rounded-md text-base font-medium w-full text-left bg-amber-600 hover:bg-amber-700 text-white transition-colors duration-200"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
