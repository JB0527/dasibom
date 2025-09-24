// 실종자 API
import { apiClient } from './client';
import type { MissingPersonDetail, MissingPersonListItem } from '../types/missingPerson';

export const missingPersonApi = {
  // 실종사건 목록 조회 (통합 API - 지도용/목록용 모두 사용)
  getCasesList: async (): Promise<MissingPersonListItem[]> => {
    const response = await apiClient.get<{ data: MissingPersonListItem[] }>('/cases');
    return response.data.data;
  },

  // 특정 실종자 상세 정보 조회 (새로운 API)
  getCaseDetail: async (caseId: number): Promise<MissingPersonDetail> => {
    const response = await apiClient.get<MissingPersonDetail>(`/cases/${caseId}`);
    return response.data;
  },
};
