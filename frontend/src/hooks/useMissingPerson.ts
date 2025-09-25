// 실종자 정보 관련 훅
import { useState } from 'react';
// import { missingPersonApi } from '../api/missingPerson';
import { mockMissingPersons } from '../data/mockMissingPersons';
import type { MissingPerson } from '../types/missingPerson';

export const useMissingPerson = () => {
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMissingPersons = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 임시로 Mock 데이터 사용 (백엔드 API가 준비되면 주석 해제)
      // const result = await missingPersonApi.getMissingPersons();
      const result = mockMissingPersons;
      setMissingPersons(result);
      return result; // 반환값 추가
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종자 정보 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
      return []; // 에러 시 빈 배열 반환
    } finally {
      setIsLoading(false);
    }
  };

  const getMissingPersonById = async (id: string): Promise<MissingPerson> => {
    try {
      // 임시로 Mock 데이터에서 찾기 (백엔드 API가 준비되면 주석 해제)
      // const result = await missingPersonApi.getMissingPersonById(id);
      const result = mockMissingPersons.find(person => person.id === id);
      
      if (!result) {
        throw new Error('실종자 정보를 찾을 수 없습니다.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종자 정보 조회 중 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }
  };

  return {
    missingPersons,
    isLoading,
    error,
    fetchMissingPersons,
    getMissingPersonById,
    clearError: () => setError(null),
  };
};
