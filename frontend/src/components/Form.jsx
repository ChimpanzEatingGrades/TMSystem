import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"; 
import "../styles/Form.css";
import "../styles/LoadingIndicator.css";
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";
  const toggleText = method === "login"
    ? "Don't have an account? Register"
    : "Already have an account? Login";
  const toggleLink = method === "login" ? "/register" : "/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(route, { username, password });

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{name}</h1>

      <input
        className="form-input"
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        className="form-input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {loading && <LoadingIndicator />}

      <button className="form-button" type="submit">
        {name}
      </button>

      <p className="form-toggle-text">
        <a href={toggleLink}>{toggleText}</a>
      </p>
    </form>
  );
}

export default Form;
