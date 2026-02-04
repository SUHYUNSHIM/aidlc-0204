import { createContext, ReactNode, useState, useEffect } from 'react';
import type { CustomerSession, LoginCredentials } from '@/types/entities';
import * as authUtils from '@/utils/auth';

interface AuthContextType {
  session: CustomerSession | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [session, setSession] = useState<CustomerSession | null>(null);

  useEffect(() => {
    // 초기 로드 시 자동 로그인 시도
    authUtils.autoLogin().then((session) => {
      if (session) {
        setSession(session);
      }
    });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const newSession = await authUtils.manualLogin(credentials);
    setSession(newSession);
  };

  const logout = () => {
    authUtils.logout();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
