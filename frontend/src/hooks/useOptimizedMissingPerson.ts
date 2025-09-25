import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMissingPersonStore } from '../stores/missingPersonStore';
import { missingPersonApi } from '../api/missingPerson';

// 지도용 훅 (Geocoding 포함)
export const useMapMissingPerson = () => {
  const location = useLocation();
  const {
    mapPersons,
    isLoading,
    isGeocoding,
    error,
    fetchAllPersons,
    fetchMapPersons,
    clearError
  } = useMissingPersonStore();

  // fetchMissingPersons 함수를 useCallback으로 안정화
  const fetchMissingPersons = useCallback(async () => {
    await fetchAllPersons();
    await fetchMapPersons();
  }, [fetchAllPersons, fetchMapPersons]);

  // 목록 페이지에서는 Geocoding 하지 않음
  useEffect(() => {
    if (location.pathname === '/missing-list') {
      return;
    }
    
    // 지도 페이지에서만 실행
    fetchMissingPersons();
  }, [location.pathname, fetchMissingPersons]);

  return {
    missingPersons: mapPersons,
    isLoading: isLoading || isGeocoding,
    error,
    fetchMissingPersons,
    clearError
  };
};

// 목록용 훅 (Geocoding 없음)
export const useListMissingPerson = () => {
  const {
    allPersons,
    recentPersons,
    oldPersons,
    isLoading,
    error,
    fetchAllPersons,
    clearError
  } = useMissingPersonStore();

  // 데이터가 없으면 자동으로 가져오기
  useEffect(() => {
    if (allPersons.length === 0) {
      fetchAllPersons();
    }
  }, [allPersons.length, fetchAllPersons]);

  // getCaseDetail 함수 추가 (useCallback으로 안정화)
  const getCaseDetail = useCallback(async (caseId: number) => {
    const response = await missingPersonApi.getCaseDetail(caseId);
    return response;
  }, []);

  return {
    allPersons,
    recentPersons,
    oldPersons,
    isLoading,
    error,
    getCasesList: fetchAllPersons,
    getCaseDetail,
    clearError
  };
};

// 상태판용 훅 (캐싱 최적화)
export const useStatusBoard = () => {
  const {
    allPersons,
    isLoading,
    error,
    fetchAllPersons
  } = useMissingPersonStore();

  // 데이터가 없으면 자동으로 가져오기
  useEffect(() => {
    if (allPersons.length === 0) {
      fetchAllPersons();
    }
  }, [allPersons.length, fetchAllPersons]);

  return {
    missingPersons: allPersons,
    isLoading,
    error
  };
};
