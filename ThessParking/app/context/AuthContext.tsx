import React, { createContext, useState, useContext, useEffect } from "react";
import { getToken, storeToken, removeToken } from "../tokenHandling";
import axios from "axios";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getToken("accessToken");

      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API + "api/v1/auth/authenticate",
        {
          email: email,
          password: password,
        }
      );

      const { access_token, refresh_token } = response.data;

      await storeToken("accessToken", access_token);
      await storeToken("refreshToken", refresh_token);

      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API + "api/v1/auth/register",
        {
          email: email,
          name: username,
          password: password,
          role: "USER",
        }
      );

      const { access_token, refresh_token } = response.data;

      await storeToken("accessToken", access_token);
      await storeToken("refreshToken", refresh_token);

      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await removeToken("accessToken");
      await removeToken("refreshToken");
      delete axios.defaults.headers.common["Authorization"];
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
