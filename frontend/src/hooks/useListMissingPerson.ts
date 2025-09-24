// 목록용 실종자 정보 훅
import { useState, useCallback } from 'react';
import { missingPersonApi } from '../api/missingPerson';
import type { MissingPersonDetail, MissingPersonListItem } from '../types/missingPerson';

export const useListMissingPerson = () => {
  const [error, setError] = useState<string | null>(null);

  const getCaseDetail = useCallback(async (caseId: number): Promise<MissingPersonDetail> => {
    try {
      // 새로운 상세 정보 API 사용
      const result = await missingPersonApi.getCaseDetail(caseId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종자 상세 정보 조회 중 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }
  }, []);

  const getCasesList = useCallback(async (): Promise<MissingPersonListItem[]> => {
    try {
      // 새로운 목록 API 사용
      const result = await missingPersonApi.getCasesList();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종사건 목록 조회 중 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    error,
    getCaseDetail,
    getCasesList,
    clearError: () => setError(null),
  };
};
