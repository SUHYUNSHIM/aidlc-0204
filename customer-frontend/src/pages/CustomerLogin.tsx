import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { LoginCredentials } from '@/types/entities';

export function CustomerLogin(): JSX.Element {
  const navigate = useNavigate();
  const { session, login, isAuthenticated } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    storeId: '',
    tableNumber: '',
    tablePassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 자동 로그인 시도 (초기 로드)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/customer/menu');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(credentials);
      navigate('/customer/menu');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '로그인에 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="customer-login">
      <div className="login-container">
        <h1>테이블 로그인</h1>

        {session && (
          <div className="session-info">
            <p>현재 로그인: {session.tableName}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="storeId">매장 ID</label>
            <input
              id="storeId"
              type="text"
              value={credentials.storeId}
              onChange={(e) =>
                setCredentials({ ...credentials, storeId: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tableNumber">테이블 번호</label>
            <input
              id="tableNumber"
              type="text"
              value={credentials.tableNumber}
              onChange={(e) =>
                setCredentials({ ...credentials, tableNumber: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tablePassword">테이블 비밀번호</label>
            <input
              id="tablePassword"
              type="password"
              value={credentials.tablePassword}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  tablePassword: e.target.value,
                })
              }
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={isLoading} className="login-btn">
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
