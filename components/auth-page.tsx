"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      if (isLogin) {
        // LOGIN
        const loginSuccess = await login(email, password);

        if (!loginSuccess) {
          setError("Invalid email or password");
        } else {
          router.replace("/products");
           window.location.reload(); // ✅ Redirect after login
        }
      } else {
        // REGISTER
        if (!businessName) {
          setError("Please enter business name");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setError("Please enter a valid email address");
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          return;
        }

        const registerSuccess = await register(
          email,
          password,
          businessName
        );

        if (!registerSuccess) {
          setError("Registration failed. Email may already exist.");
        } else {
          router.replace("/sales"); // ✅ Redirect after register
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            SalesHub
          </h1>
          <p className="text-muted-foreground">
            Business Management System
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            {/* Business Name */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Business Name
                </label>
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) =>
                    setBusinessName(e.target.value)
                  }
                  placeholder="Your business name"
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-100/50 border border-green-300 rounded-lg p-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-lg"
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
                setEmail("");
                setPassword("");
                setBusinessName("");
              }}
              className="text-primary hover:text-accent font-semibold transition-colors"
              type="button"
            >
              {isLogin ? "Sign up here" : "Login here"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Supabase Authentication
        </p>
      </div>
    </div>
  );
}
