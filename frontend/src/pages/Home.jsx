"use client"

import { useState, useEffect } from "react"
import api from "../api"
import Task from "../components/Task"

function Home() {
  const [tasks, setTasks] = useState([])
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    getTasks()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Task Manager
          </h1>
          <a
            href="/logout"
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-600 hover:border-gray-500"
          >
            Logout
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tasks Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-white">Your Tasks</h2>
            <div className="text-sm text-gray-400">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-gray-400">Loading tasks...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-300">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Tasks List */}
          {!loading && !error && (
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => <Task task={task} key={task.id} onDelete={deleteTask} onUpdate={updateTask} />)
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No tasks yet</h3>
                  <p className="text-gray-500">Create your first task to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Task Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Task
          </h2>

          <form onSubmit={createTask} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Task Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                required
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter a descriptive title for your task"
                disabled={isCreating}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                Task Description
              </label>
              <textarea
                rows="4"
                id="content"
                name="content"
                value={content}
                required
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe what needs to be done..."
                disabled={isCreating}
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !title.trim() || !content.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
