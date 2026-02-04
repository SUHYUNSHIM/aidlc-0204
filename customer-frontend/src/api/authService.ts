import axiosInstance from '@/lib/axios';
import type { LoginCredentials, AuthResponse, SessionResponse } from '@/types/entities';
import { mockAuthResponse } from '@/mocks/mockData';

// Mock 모드 활성화
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

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

  // Backend API 연동: POST /auth/table/login
  const response = await axiosInstance.post('/auth/table/login', {
    store_id: parseInt(credentials.storeId),
    table_number: parseInt(credentials.tableNumber),
    table_password: credentials.tablePassword,
  });

  // Backend 응답을 Frontend 형식으로 변환
  const data = response.data;
  return {
    token: data.access_token,
    table_id: data.table_id.toString(),
    table_name: `테이블 ${data.table_number}`,
    store_id: data.store_id.toString(),
    store_name: data.store_name,
    session_id: data.session_id,
    expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

export async function extendSession(sessionId: string): Promise<SessionResponse> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  // Backend에 세션 연장 API가 없으므로 클라이언트에서 처리
  // JWT 토큰이 16시간 유효하므로 세션 연장이 필요 없음
  return {
    expires_at: new Date(Date.now() + 57600000).toISOString(), // 16시간
  };
}

export async function logout(sessionId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  // Backend에 로그아웃 API가 없으므로 클라이언트에서만 처리
  // 로컬 스토리지 정리는 호출하는 쪽에서 처리
  return;
}
