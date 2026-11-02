import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lead_tracker_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('lead_tracker_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Timeout after 8 seconds — don't block the UI forever on cold starts
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session restore timeout')), 8000)
      );

      try {
        const data = await Promise.race([authApi.getMe(), timeout]);
        setUser(data.user);
      } catch (err) {
        console.warn('Failed to restore session:', err.message);
        // Only clear token on auth errors, not timeouts/network issues
        if (err.message !== 'Session restore timeout') {
          localStorage.removeItem('lead_tracker_token');
          setToken(null);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (phone, password) => {
    const data = await authApi.login(phone, password);
    localStorage.setItem('lead_tracker_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('lead_tracker_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin',
    isSales: user?.role === 'sales',
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
