import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleBackToHome = (): void => {
    console.log('Back to home clicked');
    window.location.hash = '';
  };

  const handleSignup = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log('Signup submit (disabled)');
    toast.info('Signup functionality coming in Sprint 1');
  };

  const handleLoginLink = (): void => {
    console.log('Log in link clicked');
    window.location.hash = '#login';
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
          <h1 className="text-2xl font-bold text-[#111827] mb-6 text-center">Join CampusKart</h1>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-[#111827] mb-2">Name</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-[#111827] mb-2">University Email (.edu)</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-[#111827] mb-2">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-medium text-[#111827] mb-2">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E7EB] text-[#1E3A8A] focus:ring-[#3B82F6]"
              />
              <label htmlFor="terms" className="text-sm text-[#6B7280]">I agree to the terms</label>
            </div>

            <button
              type="submit"
              disabled
              className="w-full px-6 py-3.5 bg-[#1E3A8A] text-white rounded-lg opacity-60 cursor-not-allowed font-semibold hover:bg-[#1E40AF] transition-colors"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <button type="button" onClick={handleLoginLink} className="text-[#1E3A8A] hover:text-[#1E40AF] font-medium">
              Log in
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-[#6B7280]">Signup functionality coming in Sprint 1</p>
        </div>
      </div>
    </div>
  );
}
