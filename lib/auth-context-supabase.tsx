// lib/auth-context-supabase.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "./supabase";
import { createUserProfile } from "./auth-actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: SupabaseUser | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    businessName: string,
  ) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProviderSupabase({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking session:", error);
        setIsLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Attempting login with email:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        return {
          success: false,
          message: error.message || "Login failed",
        };
      }

      if (data.user) {
        setUser(data.user);
        console.log("Login successful for user:", data.user.email);
        return {
          success: true,
          message: "Login successful!",
        };
      }

      return {
        success: false,
        message: "Login failed",
      };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: "An error occurred during login",
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const register = async (
    email: string,
    password: string,
    businessName: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("Attempting registration with email:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });

      if (error) {
        console.error("Registration error:", error.message);
        return {
          success: false,
          message: error.message || "Registration failed",
        };
      }

      if (!data.user) {
        console.error("No user returned from registration");
        return {
          success: false,
          message: "Registration failed",
        };
      }

      console.log("User registered:", data.user.email);

      // Create user profile with service role
      const profileResult = await createUserProfile(
        data.user.id,
        email,
        businessName,
      );

      if (!profileResult.success) {
        console.error("Profile creation failed:", profileResult.error);
        return {
          success: false,
          message: "Account created but profile setup failed",
        };
      }

      console.log("Registration successful, profile created");
      return {
        success: true,
        message:
          "Account created! Please check your email to confirm your account.",
      };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        message: "An error occurred during registration",
      };
    }
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
    throw new Error("useAuth must be used within AuthProviderSupabase");
  }
  return context;
}
