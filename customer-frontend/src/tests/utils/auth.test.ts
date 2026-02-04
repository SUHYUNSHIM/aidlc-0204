import { describe, it, expect, beforeEach } from 'vitest';
import { saveAuthToken } from '@/utils/auth';

describe('auth.ts - saveAuthToken()', () => {
  beforeEach(() => {
    // localStorage 초기화
    localStorage.clear();
  });

  it('TC-CF-001: 유효한 토큰 저장', () => {
    // Given: 유효한 JWT 토큰
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

    // When: saveAuthToken() 호출
    saveAuthToken(token);

    // Then: localStorage에 암호화되어 저장됨
    const stored = localStorage.getItem('customer_auth_token');
    expect(stored).toBeTruthy();
    expect(stored).not.toBe(token); // 암호화되어야 하므로 원본과 달라야 함
  });
});
