import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { missingPersonApi } from '../api/missingPerson';
import { geocodeAddresses, cleanAddress } from '../utils/geocodingUtils';
import { filterPersonsForMap } from '../utils/missingPersonUtils';
import type { MissingPersonMapItem } from '../types/missingPerson';

// Query Keys
const QUERY_KEYS = {
  missingPersons: ['missingPersons'] as const,
  missingPersonMap: ['missingPersons', 'map'] as const,
  missingPersonDetail: (id: number) => ['missingPersons', id] as const,
} as const;

// 지도용 훅 (Geocoding 포함)
export const useMapMissingPerson = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  // 전체 실종자 목록 조회
  const { data: allPersons, isLoading: isListLoading, error: listError } = useQuery({
    queryKey: QUERY_KEYS.missingPersons,
    queryFn: missingPersonApi.getCasesList,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 (v5에서는 gcTime)
  });

  // 지도용 데이터 (Geocoding 포함)
  const { data: mapPersons = [], isLoading: isGeocoding, error: geocodingError } = useQuery({
    queryKey: QUERY_KEYS.missingPersonMap,
    queryFn: async (): Promise<MissingPersonMapItem[]> => {
      if (!allPersons || allPersons.length === 0) {
        return [];
      }

      // 지도 표시 기준으로 필터링
      const recentPersons = filterPersonsForMap(allPersons);
      
      if (recentPersons.length === 0) {
        return [];
      }

      // 주소 정리
      const personsWithCleanedAddress = recentPersons.map(person => ({
        ...person,
        occurAddress: cleanAddress(person.occurAddress || '')
      }));
      
      // Geocoding 수행
      const geocodingResults = await geocodeAddresses(personsWithCleanedAddress);
      
      // 성공한 좌표만 지도용 데이터로 변환
      return geocodingResults
        .filter(({ coords }) => coords.success && coords.lat !== 0 && coords.lon !== 0)
        .map(({ person, coords }) => ({
          ...person,
          point: { lat: coords.lat, lon: coords.lon },
          prediction: undefined
        }));
    },
    enabled: !isListLoading && !listError && !!allPersons && location.pathname !== '/missing-list', // 목록 페이지에서는 Geocoding 하지 않음
    staleTime: 15 * 60 * 1000, // 15분간 fresh (Geocoding은 비용이 있으므로)
    gcTime: 30 * 60 * 1000, // 30분간 캐시 (v5에서는 gcTime)
  });

  // 수동 새로고침 함수
  const fetchMissingPersons = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.missingPersons });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.missingPersonMap });
  }, [queryClient]);

  const clearError = useCallback(() => {
    // React Query는 자동으로 에러를 관리하므로 별도 처리 불필요
  }, []);

  return {
    missingPersons: mapPersons,
    isLoading: isListLoading || isGeocoding,
    error: listError || geocodingError,
    fetchMissingPersons,
    clearError
  };
};

// 목록용 훅 (Geocoding 없음)
export const useListMissingPerson = () => {
  const queryClient = useQueryClient();

  // 전체 실종자 목록 조회
  const { data: allPersons = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.missingPersons,
    queryFn: missingPersonApi.getCasesList,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 (v5에서는 gcTime)
  });

  // 필터링된 데이터 (computed values)
  const now = new Date().getTime();
  const recentPersons: typeof allPersons = [];
  const oldPersons: typeof allPersons = [];
  
  allPersons.forEach((person: any) => {
    const occurDate = new Date(
      person.occurDate.substring(0, 4) + '-' +
      person.occurDate.substring(4, 6) + '-' +
      person.occurDate.substring(6, 8)
    );
    const hoursElapsed = (now - occurDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed <= 24) {
      recentPersons.push(person);
    } else {
      oldPersons.push(person);
    }
  });

  // getCaseDetail 함수 추가 (useCallback으로 안정화)
  const getCaseDetail = useCallback(async (caseId: number) => {
    const response = await missingPersonApi.getCaseDetail(caseId);
    return response;
  }, []);

  // 수동 새로고침 함수
  const getCasesList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.missingPersons });
  }, [queryClient]);

  const clearError = useCallback(() => {
    // React Query는 자동으로 에러를 관리하므로 별도 처리 불필요
  }, []);

  return {
    allPersons,
    recentPersons,
    oldPersons,
    isLoading,
    error,
    getCasesList,
    getCaseDetail,
    clearError
  };
};

// 상태판용 훅 (캐싱 최적화)
export const useStatusBoard = () => {
  // 전체 실종자 목록 조회 (다른 훅들과 동일한 캐시 공유)
  const { data: missingPersons = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.missingPersons,
    queryFn: missingPersonApi.getCasesList,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 (v5에서는 gcTime)
  });

  return {
    missingPersons,
    isLoading,
    error
  };
};
