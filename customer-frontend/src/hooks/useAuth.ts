import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import type { CustomerSession, LoginCredentials } from '@/types/entities';

interface UseAuthReturn {
  session: CustomerSession | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
