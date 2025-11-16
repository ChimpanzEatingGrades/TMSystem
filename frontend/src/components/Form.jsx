"use client"

import { useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import LoadingIndicator from "./LoadingIndicator"
import Navbar from "./Navbar"

function Form({ route, method }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const name = method === "login" ? "Login" : "Register"
  const toggleText = method === "login" ? "Don't have an account? Register" : "Already have an account? Login"
  const toggleLink = method === "login" ? "/register" : "/login"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let payload = { username, password }
      if (method !== "login") {
        payload = { ...payload, email, first_name: firstName, last_name: lastName }
      }

      const res = await api.post(route, payload)

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access)
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh)
        navigate("/")
      } else {
        navigate("/login")
      }
    } catch (error) {
      setError(error.response?.data?.detail || error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">Employee Portal</h1>
            <p className="text-gray-600">
              {method === "login" ? "Welcome back! Please sign in to continue." : "Create your account to get started."}
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-black mb-2">{name}</h2>
              <div className="w-12 h-1 bg-[#FFC601] rounded-full mx-auto"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-[#DD7373] mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-[#DD7373] text-sm">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email / Name Fields (only in Register) */}
              {method !== "login" && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </>
              )}

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim()}
                className="w-full bg-[#FFC601] hover:bg-yellow-500 disabled:bg-gray-300 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
              >
                {loading ? (
                  <>
                    <LoadingIndicator />
                    <span className="ml-2">{method === "login" ? "Signing in..." : "Creating account..."}</span>
                  </>
                ) : (
                  <>{name}</>
                )}
              </button>
            </form>

            {/* Toggle Link */}
            <div className="mt-8 text-center">
              <a
                href={toggleLink}
                className="text-[#DD7373] hover:text-red-600 font-medium transition-colors duration-200 hover:underline"
              >
                {toggleText}
              </a>
            </div>
          </div>

          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>© 2025 Esfandiary and Judaya. Secure and reliable management.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Form
