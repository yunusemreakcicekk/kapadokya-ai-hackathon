'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockUsers, mockSellers } from '../data/mockUsers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = useCallback(async (role) => {
    setLoading(true);
    // Simulate login by role
    const mockUser = mockUsers.find(u => u.role === role);
    if (mockUser) {
      setUser(mockUser);
      if (role === 'seller') {
        const mockSeller = mockSellers.find(s => s.userId === mockUser.userId);
        setSeller(mockSeller || null);
      }
    }
    setLoading(false);
    return mockUser;
  }, []);

  const loginAsUser = useCallback(async (userId) => {
    setLoading(true);
    const mockUser = mockUsers.find(u => u.userId === userId);
    if (mockUser) {
      setUser(mockUser);
      if (mockUser.role === 'seller') {
        const mockSeller = mockSellers.find(s => s.userId === mockUser.userId);
        setSeller(mockSeller || null);
      }
    }
    setLoading(false);
    return mockUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSeller(null);
    router.push('/');
  }, [router]);

  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{
      user,
      seller,
      loading,
      login,
      loginAsUser,
      logout,
      isAdmin,
      isSeller,
      isCustomer,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
