// 인증 API
import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  // PASS 인증 시작 (신고용) - TODO: 백엔드에 /auth/pass/start 엔드포인트 구현 필요, 현재는 러프 구현
  startPassAuth: async (phone: string): Promise<{ sessionId: string }> => {
    const response = await apiClient.post('/auth/pass/start', { phone });
    return response.data;
  },

  // PASS 인증 확인 (신고 전용 토큰 발급) - TODO: 백엔드에 /auth/pass/verify 엔드포인트 구현 필요, 현재는 러프 구현, 실제 PASS API 연동 필요
  verifyPassAuth: async (sessionId: string, authCode: string): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/pass/verify', { sessionId, authCode });
    return response.data;
  },

  // 문자 인증 시작 (대안) - TODO: SMS API 연동 필요, 현재는 러프 구현
  startSmsAuth: async (phone: string): Promise<{ sessionId: string }> => {
    const response = await apiClient.post('/auth/sms/start', { phone });
    return response.data;
  },

  // 문자 인증 확인 (대안) - TODO: 인증번호 검증 로직 구현 필요, 현재는 러프 구현
  verifySmsAuth: async (sessionId: string, authCode: string): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/sms/verify', { sessionId, authCode });
    return response.data;
  },

  // 기존 회원가입 (현재 백엔드 구현) - TODO: 신고용 임시 토큰 발급으로 활용 가능
  signup: async (phone: string, name: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/signup', { phone, name });
    return response.data;
  },
};
