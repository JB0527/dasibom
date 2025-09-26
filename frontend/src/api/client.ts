// API 서비스
import axios from 'axios';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초로 증가
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 헤더에 추가
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    // 타임아웃 에러 로깅
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('API 요청 타임아웃:', error.config?.url, error.message);
    }
    
    return Promise.reject(error);
  }
);
