// 지도용 실종자 정보 훅
import { useState } from 'react';
import { missingPersonApi } from '../api/missingPerson';
import type { MissingPersonDetail, MissingPersonListItem } from '../types/missingPerson';

export const useMapMissingPerson = () => {
  const [missingPersons, setMissingPersons] = useState<MissingPersonListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissingPersons = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 통합 API 사용 (모든 데이터 가져오기)
      const result = await missingPersonApi.getCasesList();
      
      // 24시간 이내 실종자만 필터링
      const recentMissingPersons = result.filter(person => {
        const occurDate = new Date(
          person.occurDate.substring(0, 4) + '-' +
          person.occurDate.substring(4, 6) + '-' +
          person.occurDate.substring(6, 8)
        );
        const hoursElapsed = (new Date().getTime() - occurDate.getTime()) / (1000 * 60 * 60);
        return hoursElapsed <= 24; // 24시간 이내만
      });
      
      setMissingPersons(recentMissingPersons);
      return recentMissingPersons;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종자 정보 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return []; // 에러 시 빈 배열 반환
    } finally {
      setIsLoading(false);
    }
  };

  // getMissingPersonById 제거됨 - 레거시 API 삭제

  const getCaseDetail = async (caseId: number): Promise<MissingPersonDetail> => {
    try {
      // 새로운 상세 정보 API 사용
      const result = await missingPersonApi.getCaseDetail(caseId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종자 상세 정보 조회 중 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }
  };

  return {
    missingPersons,
    isLoading,
    error,
    fetchMissingPersons,
    getCaseDetail,
    clearError: () => setError(null),
  };
};
