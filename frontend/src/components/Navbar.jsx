"use client"

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, ChefHat, LogOut, Home, Info, ShoppingCart, ClipboardList, Utensils, BarChart3, Boxes
} from "lucide-react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import NotificationPanel from "./NotificationPanel";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [menuLink, setMenuLink] = useState("/digital-menu");
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the digital menu link
  useEffect(() => {
    const storedOrder = localStorage.getItem("customer_order");
    if (storedOrder) {
      const order = JSON.parse(storedOrder);
      if (order.branch) {
        setMenuLink(`/digital-menu/${order.branch}`);
      }
    }
  }, [location]);

  // Check authentication and fetch user info
  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    setIsAuthenticated(!!token);

    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.groups || decoded.is_superuser !== undefined) {
          setUserGroups(decoded.groups || []);
          setIsSuperuser(decoded.is_superuser || false);
        } else {
          fetchUserInfo();
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    } else {
      setUserGroups([]);
      setIsSuperuser(false);
    }
  }, [location]);

  const fetchUserInfo = async () => {
    try {
      const res = await api.get("/api/user/");
      const data = res.data;
      if (data) {
        setUserGroups(data.groups || []);
        setIsSuperuser(data.is_superuser || false);
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    setIsAuthenticated(false);
    setUserGroups([]);
    setIsSuperuser(false);
    navigate("/");
    setIsOpen(false);
  };

  const handleNavigation = (path) => {
    if (path === "/tasks" && !isAuthenticated) {
      navigate("/login");
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Determine role-based access
  const isManager = userGroups.map((g) => g.toLowerCase()).includes("manager");
  const isCashier = userGroups.map((g) => g.toLowerCase()).includes("cashier");

  // Visibility helpers
  const canSeeInventory = isManager || isSuperuser;
  const canSeeMenu = isManager || isSuperuser;
  const canSeeReports = isManager || isSuperuser;
  const canSeeOrders = isCashier || isManager || isSuperuser;

  // --- Reusable button ---
  const NavButton = ({ path, icon: Icon, label }) => (
    <button
      onClick={() => handleNavigation(path)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
        isActive(path)
          ? "bg-[#FFC601] text-black"
          : "text-gray-700 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  // --- Reusable button for mobile ---
  const MobileButton = ({ path, icon: Icon, label }) => (
    <button
      onClick={() => handleNavigation(path)}
      className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 flex items-center space-x-2 ${
        isActive(path)
          ? "bg-[#FFC601] text-black"
          : "text-gray-700 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left: Logo + Notifications */}
          <div className="flex items-center gap-3">
            {isAuthenticated && <NotificationPanel />}
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors duration-200"
            >
              <ChefHat size={28} className="text-[#FFC601]" />
              <span className="text-xl font-bold">Kapitan Sisig</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavButton path="/" icon={Home} label="Home" />
              <NavButton path={menuLink} icon={Utensils} label="Menu" />
              <NavButton path="/shopping-cart" icon={ShoppingCart} label="Cart" />
              <NavButton path="/about" icon={Info} label="About" />

              {isAuthenticated && canSeeInventory && (
                <NavButton path="/inventory" icon={Boxes} label="Inventory" />
              )}
              {isAuthenticated && canSeeMenu && (
                <NavButton path="/menu" icon={Utensils} label="Menu Mgmt" />
              )}
              {isAuthenticated && canSeeOrders && (
                <NavButton path="/orders" icon={ClipboardList} label="Orders" />
              )}
              {isAuthenticated && canSeeReports && (
                <NavButton path="/reports" icon={BarChart3} label="Reports" />
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="bg-[#DD7373] hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavigation("/login")}
                className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-gray-100 inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-black hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FFC601]"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <MobileButton path="/" icon={Home} label="Home" />
            <MobileButton path={menuLink} icon={Utensils} label="Menu" />
            <MobileButton path="/shopping-cart" icon={ShoppingCart} label="Cart" />
            <MobileButton path="/about" icon={Info} label="About" />

            {isAuthenticated && canSeeInventory && (
              <MobileButton path="/inventory" icon={Boxes} label="Inventory" />
            )}
            {isAuthenticated && canSeeMenu && (
              <MobileButton path="/menu" icon={Utensils} label="Menu Mgmt" />
            )}
            {isAuthenticated && canSeeOrders && (
              <MobileButton path="/orders" icon={ClipboardList} label="Orders" />
            )}
            {isAuthenticated && canSeeReports && (
              <MobileButton path="/reports" icon={BarChart3} label="Reports" />
            )}

            <div className="border-t border-gray-200 pt-4">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="block px-3 py-2 rounded-md text-base font-medium w-full text-left bg-[#DD7373] hover:bg-red-600 text-white transition-colors duration-200 flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNavigation("/login")}
                  className="block px-3 py-2 rounded-md text-base font-medium w-full text-left bg-gray-800 hover:bg-black text-white transition-colors duration-200"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
