'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from './db';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, password: string, businessName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session storage on mount
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        setUser(JSON.parse(sessionUser));
      } catch {
        sessionStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const { loginUser } = require('./db');
    const loggedInUser = loginUser(username, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      return true;
    }
    return false;
  };

  const logout = (): void => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const register = (username: string, password: string, businessName: string): boolean => {
    const { registerUser } = require('./db');
    const newUser = registerUser(username, password, businessName);
    if (newUser) {
      setUser(newUser);
      sessionStorage.setItem('currentUser', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
