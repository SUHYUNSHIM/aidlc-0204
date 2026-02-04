import axios from 'axios';
import { getAuthToken } from '@/utils/auth';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  timeout: 10000,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use((config) => {
  // JWT 토큰 추가
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 인증 에러 처리
    if (error.response?.status === 401) {
      // 로그아웃 및 로그인 화면으로 리다이렉트
      localStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
