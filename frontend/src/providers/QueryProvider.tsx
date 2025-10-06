import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본적으로 5분간 fresh 상태 유지
      staleTime: 5 * 60 * 1000,
      // 10분간 캐시 유지 (v5에서는 gcTime)
      gcTime: 10 * 60 * 1000,
      // 에러 시 3번 재시도
      retry: 3,
      // 백그라운드에서 자동 리페치 비활성화 (수동으로 제어)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // 뮤테이션도 3번 재시도
      retry: 3,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider ({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
