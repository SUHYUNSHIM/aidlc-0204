import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../../api/client';

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  
  // UI 상태
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  
  // SSE 상태
  const [sseConnected, setSseConnected] = useState(false);
  const [sseError, setSseError] = useState(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  
  // 로그인
  const login = async (storeId, username, password) => {
    const { data } = await apiClient.post('/api/v1/auth/admin/login', {
      store_id: parseInt(storeId),
      username,
      password,
    });
    
    // 토큰 저장 (백엔드는 access_token과 expires_in을 반환)
    const expiry = Date.now() + (data.expires_in * 1000);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('tokenExpiry', expiry);
    
    // 상태 업데이트
    setIsAuthenticated(true);
    setAdminUser({
      username: data.username,
      storeId: data.store_id,
      storeName: data.store_name,
      token: data.access_token,
      tokenExpiry: expiry,
    });
  };
  
  // 로그아웃
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setIsAuthenticated(false);
    setAdminUser(null);
  };
  
  // 토큰 자동 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (!tokenExpiry) return;
      
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;
      
      // 만료 5분 전
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        apiClient.post('/api/v1/auth/admin/refresh-token')
          .then(({ data }) => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tokenExpiry', data.expiry);
          })
          .catch(() => logout());
      }
    }, 60000); // 1분마다 체크
    
    return () => clearInterval(interval);
  }, []);
  
  // 자동 로그인 (페이지 새로고침 시)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (token && tokenExpiry && Date.now() < tokenExpiry) {
      setIsAuthenticated(true);
      // adminUser는 실제로는 토큰에서 디코딩하거나 API 호출로 가져와야 함
    }
  }, []);
  
  const value = {
    // 인증
    isAuthenticated,
    adminUser,
    login,
    logout,
    
    // UI 상태
    selectedTableId,
    setSelectedTableId,
    showOrderDetailModal,
    setShowOrderDetailModal,
    
    // SSE 상태
    sseConnected,
    setSseConnected,
    sseError,
    setSseError,
    pollingEnabled,
    setPollingEnabled,
  };
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
};
