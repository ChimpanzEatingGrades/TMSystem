import react from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import About from "./pages/About"
import Inventory from "./pages/inventory"
import LandingPage from "./pages/LandingPage"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import MenuPage from "./pages/MenuPage"
import MenuFormPage from "./pages/MenuFormPage";
import MenuItemsPage from "./components/MenuItems/MenuItemsPage";
import DigitalMenu from "./pages/DigitalMenu"
import ShoppingCart from "./pages/ShoppingCart"

function Logout(){
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/digital-menu" element={<DigitalMenu />} />
        <Route path="/shopping-cart" element={<ShoppingCart />} />
        <Route path="/about" element={<About />} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>}
        />
        <Route path="/menu" element={<ProtectedRoute><MenuItemsPage /></ProtectedRoute>} />
        {/* <Route path="/menu/new" element={<ProtectedRoute><MenuFormPage /></ProtectedRoute>} />
        <Route path="/menu/:id/edit" element={<ProtectedRoute><MenuFormPage /></ProtectedRoute>} /> */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/tasks" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
