import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

function ProtectedRoute({ children, requiredGroup }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuthAndRoles = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);

      if (!token) {
        setIsAuthorized(false);
        return;
      }

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (err) {
        console.error("Failed to decode token:", err);
        setIsAuthorized(false);
        return;
      }

      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          setIsAuthorized(false);
          return;
        }
        decoded = jwtDecode(localStorage.getItem(ACCESS_TOKEN));
      }

      const userInfo = await getUserInfo(decoded);

      // ✅ Superusers can access everything
      if (userInfo.isSuperuser) {
        setIsAuthorized(true);
        return;
      }

      // ✅ No required group means route is public
      if (!requiredGroup) {
        setIsAuthorized(true);
        return;
      }

      const userGroups = userInfo.groups.map((g) => g.toLowerCase());
      let hasPermission = false;

      // ✅ Manager pages
      if (requiredGroup === "manager") {
        hasPermission = userGroups.includes("manager");
      }

      // ✅ Cashier pages (cashier OR manager can access)
      else if (requiredGroup === "cashier") {
        hasPermission =
          userGroups.includes("cashier") || userGroups.includes("manager");
      }

      setIsAuthorized(hasPermission);
    };

    checkAuthAndRoles();
  }, [children, requiredGroup]);

  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (!refresh) return false;

    try {
      const res = await api.post("/api/token/refresh/", { refresh });
      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        return true;
      }
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
    return false;
  };

  const getUserInfo = async (decoded) => {
    // ✅ Use JWT if groups are embedded
    if (decoded.groups || decoded.is_superuser !== undefined) {
      return {
        groups: decoded.groups || [],
        isSuperuser: decoded.is_superuser || false,
      };
    }

    // ✅ Otherwise, fetch from backend
    try {
      const res = await api.get("/api/user/");
      const user = res.data;

      // Handle both list of strings or list of objects
      let groups = [];
      if (Array.isArray(user.groups)) {
        if (typeof user.groups[0] === "string") {
          groups = user.groups;
        } else if (typeof user.groups[0] === "object" && user.groups[0].name) {
          groups = user.groups.map((g) => g.name);
        }
      }

      return {
        groups: groups,
        isSuperuser: user.is_superuser || false,
      };
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      return { groups: [], isSuperuser: false };
    }
  };

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/unauthorized" />;
}

export default ProtectedRoute;
