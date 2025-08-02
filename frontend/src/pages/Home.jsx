import { useState, useEffect } from "react";
import api from "../api";
import Task from "../components/Task";
import "../styles/Home.css"; 

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
      .then((res) => res.data)
      .then((data) => { setTasks(data); console.log(data) })
      .catch((err) => alert(err)); 
  };

  const deleteTask = (id) => {
    api
      .delete(`/api/tasks/delete/${id}/`)
      .then((res) => {
        if (res.status === 204)
          alert ("Task Deleted");
          else alert("Failed to delete task");
          getTasks();
      })
      .catch((error) => alert(error));
    
  }

  const createTask = (e) => {
    e.preventDefault();
    api
      .post("/api/tasks/", { content, title })
      .then((res) => {
        if (res.status === 201) {
          alert("Task Created");
          getTasks();
        } else {
          alert("Failed to create task");
        }
      })
      .catch((error) => alert(error));

  }


  return (
    <div>
      
      <div>

        <h1>Tasks</h1>

        {tasks.map((task) => (
          <Task task={task} key={task.id} onDelete={deleteTask} />
          
        ))}

      </div>

      <h2>Create a Task</h2>

      <form onSubmit={createTask}>
        <label htmlFor="title">Title:</label>
        <br />
        <input 
          type="text" 
          id="title" 
          name="title" 
          value = {title}
          required 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <br />
        <textarea 
          rows="4"
          cols="50"
          placeholder="Enter task content here"
          type="text" 
          id="content" 
          name="content" 
          value = {content}
          required 
          onChange={(e) => setContent(e.target.value)} 
        />
        <br />
        <input type="submit" value="Submit" />
      </form>

    </div>
  );
}

export default Home;
// This is the Home page component for the Task Management System.