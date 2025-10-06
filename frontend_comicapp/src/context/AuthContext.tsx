import { createContext, useState, useEffect } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  role: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  role: null,
  login: () => {},
  logout: () => {},
});

// Hàm kiểm tra token có hết hạn không
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // decode payload từ JWT
    const expiry = payload.exp * 1000; // exp là giây, convert sang ms
    return Date.now() > expiry;
  } catch (e) {
    return true; // token lỗi thì coi như hết hạn
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
      setRole(storedRole);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setIsLoggedIn(false);
      setRole(null);
    }
  }, []);

  const login = (token: string, role: string) => {
    if (!isTokenExpired(token)) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      setIsLoggedIn(true);
      setRole(role);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setIsLoggedIn(false);
      setRole(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
