"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api"
import Task from "../components/Task"
import Navbar from "../components/Navbar"
import { ACCESS_TOKEN } from "../constants"

function Home() {
  const [tasks, setTasks] = useState([])
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN)
    if (!token) {
      navigate("/login")
      return
    }
    getTasks()
  }, [navigate])

  const getTasks = () => {
    setLoading(true)
    api
      .get("/api/tasks/")
      .then((res) => res.data)
      .then((data) => {
        setTasks(data)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }

  const deleteTask = (id) => {
    api
      .delete(`/api/tasks/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          getTasks()
        } else {
          alert("Failed to delete task")
        }
      })
      .catch((error) => alert(error))
  }

  const updateTask = (id, updatedTask) => {
    api
      .put(`/api/tasks/${id}/`, updatedTask)
      .then((res) => {
        if (res.status === 200) {
          getTasks()
        } else {
          alert("Failed to update task")
        }
      })
      .catch((error) => alert(error))
  }

  const createTask = async (e) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const res = await api.post("/api/tasks/", { content, title })
      if (res.status === 201) {
        setContent("")
        setTitle("")
        getTasks()
      } else {
        alert("Failed to create task")
      }
    } catch (error) {
      alert("Failed to create task")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Task Management Dashboard</h1>
          <p className="text-gray-600">Organize your work and boost your productivity</p>
          <a className="text-lg text-black-500 mt-2 block" target="_blank" href="http://127.0.0.1:8000/admin/">Manage Users</a>
        </div>

        {/* Tasks Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-black">Your Tasks</h2>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFC601]"></div>
              <span className="ml-3 text-gray-600">Loading tasks...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#DD7373] mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[#DD7373]">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Tasks List */}
          {!loading && !error && (
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => <Task task={task} key={task.id} onDelete={deleteTask} onUpdate={updateTask} />)
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No tasks yet</h3>
                  <p className="text-gray-500">Create your first task to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Task Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-black mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#FFC601]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Task
          </h2>

          <form onSubmit={createTask} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                required
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-all duration-200"
                placeholder="Enter a descriptive title for your task"
                disabled={isCreating}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Task Description
              </label>
              <textarea
                rows="4"
                id="content"
                name="content"
                value={content}
                required
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFC601] focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe what needs to be done..."
                disabled={isCreating}
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !title.trim() || !content.trim()}
              className="w-full bg-[#FFC601] hover:bg-yellow-500 disabled:bg-gray-300 text-black font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Creating Task...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Task
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Home
