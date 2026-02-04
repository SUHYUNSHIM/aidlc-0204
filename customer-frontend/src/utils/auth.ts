import type { CustomerSession, LoginCredentials } from '@/types/entities';
import { secureStorage } from './encryption';
import * as authService from '@/api/authService';

// 토큰 관리
export function saveAuthToken(token: string): void {
  secureStorage.setItem('customer_auth_token', token);
}

export function getAuthToken(): string | null {
  return secureStorage.getItem<string>('customer_auth_token');
}

export function removeAuthToken(): void {
  secureStorage.removeItem('customer_auth_token');
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    return Date.now() >= expiresAt;
  } catch {
    return true;
  }
}

// 세션 관리
export function saveSession(session: CustomerSession): void {
  secureStorage.setItem('customer_session', session);
}

export function getSession(): CustomerSession | null {
  return secureStorage.getItem<CustomerSession>('customer_session');
}

export function removeSession(): void {
  secureStorage.removeItem('customer_session');
}

export function validateSession(session: CustomerSession): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  return session.isActive && expiresAt > now;
}

// 로그인/로그아웃
export async function autoLogin(): Promise<CustomerSession | null> {
  const token = getAuthToken();
  const session = getSession();

  if (!token || !session) {
    return null;
  }

  if (!validateSession(session)) {
    // 세션 만료 시 자동 연장 시도
    try {
      return await extendSession(session);
    } catch {
      return null;
    }
  }

  return session;
}

export async function manualLogin(credentials: LoginCredentials): Promise<CustomerSession> {
  const response = await authService.login(credentials);

  const session: CustomerSession = {
    tableId: response.table_id,
    tableName: response.table_name,
    storeId: response.store_id,
    storeName: response.store_name,
    authToken: response.token,
    sessionId: response.session_id,
    expiresAt: response.expires_at,
    isActive: true,
  };

  saveAuthToken(session.authToken);
  saveSession(session);

  return session;
}

export function logout(): void {
  removeAuthToken();
  removeSession();
  localStorage.removeItem('customer_cart');
}

export async function extendSession(session: CustomerSession): Promise<CustomerSession> {
  const response = await authService.extendSession(session.sessionId);

  const updatedSession = {
    ...session,
    expiresAt: response.expires_at,
  };

  saveSession(updatedSession);
  return updatedSession;
}
