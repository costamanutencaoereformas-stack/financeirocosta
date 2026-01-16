import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "./queryClient";

interface User {
  id: string;
  fullName: string | null;
  role: "admin" | "financial" | "viewer";
  status: string | null;
  team: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, role?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    // Legacy generic login - might need update for Supabase
    const response = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await response.json();
    setUser(data.user);
  }

  async function logout() {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
  }

  async function register(name: string, role?: string) {
    // Adjusted to not require password/username if creating generic profiles
    // But endpoint is disabled on backend
    const response = await apiRequest("POST", "/api/auth/register", { name, role });
    const data = await response.json();
    if (!user) {
      setUser(data.user);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
