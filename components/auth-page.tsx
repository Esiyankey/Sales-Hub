'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (isLogin) {
      if (!login(username, password)) {
        setError('Invalid username or password');
      } else {
        setUsername('');
        setPassword('');
      }
    } else {
      if (!businessName) {
        setError('Please enter business name');
        setIsLoading(false);
        return;
      }
      if (!register(username, password, businessName)) {
        setError('Username already exists');
      } else {
        setUsername('');
        setPassword('');
        setBusinessName('');
        setIsLogin(true);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SalesHub</h1>
          <p className="text-muted-foreground">Business Management System</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 mb-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full"
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Business Name</label>
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary hover:text-accent font-semibold transition-colors"
            >
              {isLogin ? 'Sign up here' : 'Login here'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          All data is stored locally and encrypted in your browser
        </p>
      </div>
    </div>
  );
}
