// 실종자 API
import { apiClient } from './client';
import type { MissingPerson } from '../types/missingPerson';

export const missingPersonApi = {
  // 모든 실종자 조회
  getMissingPersons: async (): Promise<MissingPerson[]> => {
    const response = await apiClient.get('/missing-persons');
    return response.data;
  },

  // 특정 실종자 조회
  getMissingPersonById: async (id: string): Promise<MissingPerson> => {
    const response = await apiClient.get(`/missing-persons/${id}`);
    return response.data;
  },

  // 실종자 등록
  createMissingPerson: async (missingPersonData: Omit<MissingPerson, 'id'>): Promise<MissingPerson> => {
    const response = await apiClient.post('/missing-persons', missingPersonData);
    return response.data;
  },

  // 실종자 정보 수정
  updateMissingPerson: async (id: string, missingPersonData: Partial<MissingPerson>): Promise<MissingPerson> => {
    const response = await apiClient.patch(`/missing-persons/${id}`, missingPersonData);
    return response.data;
  },

  // 실종자 삭제
  deleteMissingPerson: async (id: string): Promise<void> => {
    await apiClient.delete(`/missing-persons/${id}`);
  },
};
