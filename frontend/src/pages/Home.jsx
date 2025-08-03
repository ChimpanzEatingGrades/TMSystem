import { useState, useEffect } from "react";
import api from "../api";
import Task from "../components/Task";
import "../styles/Home.css"; // Assuming you have a CSS file for Home styles

function Home() {
  const [tasks, setTasks] = useState([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    getTasks();
  }, []);

  const getTasks = () => {
    api
      .get("/api/tasks/")
      .then((res) => setTasks(res.data))
      .catch((err) => alert(err));
  };

  const deleteTask = (id) => {
    api
      .delete(`/api/tasks/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          getTasks();
        } else {
          alert("Failed to delete task");
        }
      })
      .catch((error) => alert(error));
  };

  const createTask = (e) => {
    e.preventDefault();
    api
      .post("/api/tasks/", { content, title })
      .then((res) => {
        if (res.status === 201) {
          setTitle("");
          setContent("");
          getTasks();
        } else {
          alert("Failed to create task");
        }
      })
      .catch((error) => alert(error));
  };

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      {/* Logout Link */}
      <a
        href="/logout"
        className="absolute top-4 right-4 text-blue-600 hover:underline font-medium"
      >
        Logout
      </a>

      {/* Task List Section */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Tasks</h1>

        <div className="space-y-4">
          {tasks.map((task) => (
            <Task
              task={task}
              key={task.id}
              onDelete={deleteTask}
              onUpdate={getTasks}
            />
          ))}
        </div>

        {/* Create Task Form */}
        <div className="mt-10 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create a New Task</h2>
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                rows="4"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Home;
