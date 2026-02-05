import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, DonorUser, ReceiverUser, OrganizationUser } from '@/types';
import { getSession, setSession, getUserByEmail, saveUser, generateId, getUserById } from '@/lib/storage';

type RegisterData = 
  | Omit<ReceiverUser, 'id' | 'createdAt'>
  | Omit<DonorUser, 'id' | 'createdAt'>
  | Omit<OrganizationUser, 'id' | 'createdAt'>;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(() => {
    if (user) {
      const freshUser = getUserById(user.id);
      if (freshUser) {
        setUser(freshUser);
        setSession(freshUser);
      }
    }
  }, [user]);

  useEffect(() => {
    const session = getSession();
    if (session) {
      // Refresh from storage in case data changed
      const freshUser = getUserById(session.id);
      setUser(freshUser || null);
    }
    setIsLoading(false);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bloodlink_session') {
        const newSession = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(newSession);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const existingUser = getUserByEmail(email);
    if (!existingUser) {
      return { success: false, error: 'No account found with this email' };
    }
    if (existingUser.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }
    setUser(existingUser);
    setSession(existingUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setSession(null);
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const existingUser = getUserByEmail(userData.email);
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' };
    }

    const newUser = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    } as User;

    saveUser(newUser);
    setUser(newUser);
    setSession(newUser);
    return { success: true };
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates } as User;
    saveUser(updatedUser);
    setUser(updatedUser);
    setSession(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if donor is on cooldown
export function useDonorCooldown(donor: DonorUser | null) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (!donor?.cooldownEndDate) {
      setIsOnCooldown(false);
      setDaysRemaining(0);
      return;
    }

    const checkCooldown = () => {
      const now = new Date();
      const cooldownEnd = new Date(donor.cooldownEndDate!);
      const onCooldown = now < cooldownEnd;
      setIsOnCooldown(onCooldown);

      if (onCooldown) {
        const diffTime = cooldownEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
      } else {
        setDaysRemaining(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [donor?.cooldownEndDate]);

  return { isOnCooldown, daysRemaining };
}
