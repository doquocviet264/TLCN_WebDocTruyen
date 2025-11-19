import { createContext, useState, useEffect, useContext } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  role: string | null;
  userId: number | null; 
  login: (token: string, role: string, userId: number) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  role: null,
  userId: null, 
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
  const [userId, setUserId] = useState<number | null>(null); 

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const storedUserId = localStorage.getItem("userId");

    if (token && !isTokenExpired(token)) {
      setIsLoggedIn(true);
      setRole(storedRole);
      if (storedUserId) {
        setUserId(parseInt(storedUserId, 10));
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      setIsLoggedIn(false);
      setRole(null);
      setUserId(null); 
    }
  }, []);

  const login = (token: string, role: string, userId: number) => {
    if (!isTokenExpired(token)) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      console.log(userId)
      localStorage.setItem("userId", userId.toString()); 
      setIsLoggedIn(true);
      setRole(role);
      setUserId(userId);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      setIsLoggedIn(false);
      setRole(null);
      setUserId(null); 
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
