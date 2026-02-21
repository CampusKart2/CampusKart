import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleBackToHome = (): void => {
    console.log('Back to home clicked');
    window.location.hash = '';
  };

  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log('Login submit (disabled)');
    toast.info('Login functionality coming in Sprint 1');
  };

  const handleSignupLink = (): void => {
    console.log('Sign up link clicked');
    window.location.hash = '#signup';
  };

  const inputClass = 'w-full h-12 pl-4 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:shadow-md transition-all duration-300';

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-12 flex items-start justify-center px-6">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1E3A8A] font-medium mb-6 transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to home
        </button>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-8">
          <h1 className="text-2xl font-bold text-[#111827] mb-6 text-center">Welcome Back to CampusKart</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#111827] mb-2">University Email (.edu)</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[#111827] mb-2">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#3B82F6]"
              />
              <label htmlFor="remember" className="text-sm text-[#6B7280]">Remember me</label>
            </div>

            <button
              type="submit"
              disabled
              className="w-full px-6 py-3.5 bg-[#1E3A8A] text-white rounded-lg opacity-60 cursor-not-allowed font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              Log In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <button type="button" onClick={handleSignupLink} className="text-[#1E3A8A] hover:text-[#1E40AF] font-medium">
              Sign up
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-[#6B7280]">Login functionality coming in Sprint 1</p>
        </div>
      </div>
    </div>
  );
}
