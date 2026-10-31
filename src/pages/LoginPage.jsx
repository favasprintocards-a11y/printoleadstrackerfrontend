import React, { useState } from 'react';
import { Phone, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phone.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative brand background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8622C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A8C93C]/12 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Card */}
        <div className="bg-[#FAF8F5] rounded-3xl shadow-2xl border border-[#E2DDD6] p-8 sm:p-10 text-[#2B2B2B]">
          {/* Logo & Intro */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/logo.png"
                alt="Printo Cards & Technologies"
                className="h-20 w-auto object-contain"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-[#FBF0EF] border border-[#E8BDB8] text-[#B23A2E] text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#8C8782]" />
                <input
                  type="tel"
                  required
                  placeholder="Mobile Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2DDD6] text-[#2B2B2B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8C8782]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#E2DDD6] text-[#2B2B2B] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8622C]/20 focus:border-[#E8622C] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#E8622C] hover:bg-[#D0521F] active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#E8622C]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
