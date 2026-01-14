import { useState, useCallback } from 'react';
import { DEFAULT_ADMIN } from '../constants/config';

export interface User {
  name: string;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string): boolean => {
    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      setUser({ name: DEFAULT_ADMIN.name, isAdmin: true });
      return true;
    } else {
      setUser({ name: email.split('@')[0] || 'Usuário', isAdmin: false });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false
  };
};
