'use client';

import { useState, type SyntheticEvent } from 'react';
import { Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, error, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const data = await login({ email, password });
    if (data) {
      navigate(data.user.role === 'faculty' ? '/dashboard' : '/admin/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-8 bg-white">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <div className="bg-black p-2 rounded-full">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-secondary">Admin Portal</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-secondary font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email Address"
              className="border-gray-300 rounded-none h-12 focus-visible:ring-secondary"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-secondary font-semibold">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="border-gray-300 rounded-none h-12 focus-visible:ring-secondary pr-10"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="min-h-10">
            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD700] hover:bg-[#e6c200] text-secondary font-bold h-12 text-lg rounded-none shadow-md disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}