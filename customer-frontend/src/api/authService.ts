import axiosInstance from '@/lib/axios';
import type { LoginCredentials, AuthResponse, SessionResponse } from '@/types/entities';
import { mockAuthResponse } from '@/mocks/mockData';

// Mock 모드 활성화
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true;

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // 간단한 검증 (테스트용)
    if (credentials.tablePassword === 'password' || credentials.tablePassword === '1234') {
      return {
        ...mockAuthResponse,
        table_name: `테이블 ${credentials.tableNumber}`,
        store_name: credentials.storeId === 'store-1' ? '테스트 레스토랑' : '다른 레스토랑',
      };
    }
    
    throw new Error('잘못된 비밀번호입니다.');
  }

  const response = await axiosInstance.post('/customer/login', {
    store_id: credentials.storeId,
    table_number: credentials.tableNumber,
    table_password: credentials.tablePassword,
  });

  return response.data;
}

export async function extendSession(sessionId: string): Promise<SessionResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  const response = await axiosInstance.post('/customer/extend-session', {
    session_id: sessionId,
  });

  return response.data;
}

export async function logout(sessionId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  await axiosInstance.post('/customer/logout', {
    session_id: sessionId,
  });
}
