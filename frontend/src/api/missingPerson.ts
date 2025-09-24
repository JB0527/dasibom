// 실종자 API
import { apiClient } from './client';
import type { MissingPerson } from '../types/missingPerson';

export const missingPersonApi = {
  // 모든 실종자 조회 - TODO: 백엔드 CaseResponse 타입과 MissingPerson 타입 매핑 필요
  getMissingPersons: async (): Promise<MissingPerson[]> => {
    const response = await apiClient.get('/cases');
    return response.data;
  },

  // 지도용 실종자 조회 - TODO: 백엔드에 /cases/map 엔드포인트 구현 필요
  getMissingPersonsForMap: async (): Promise<MissingPerson[]> => {
    const response = await apiClient.get('/cases/map');
    return response.data;
  },

  // 특정 실종자 조회 - TODO: 백엔드 CaseResponse 타입과 MissingPerson 타입 매핑 필요
  getMissingPersonById: async (id: string): Promise<MissingPerson> => {
    const response = await apiClient.get(`/cases/${id}`);
    return response.data;
  },

  // 실종자 등록 - TODO: CreateCaseRequest DTO와 MissingPerson 타입 매핑 필요, DB 연결 확인 필요
  createMissingPerson: async (missingPersonData: Omit<MissingPerson, 'id'>): Promise<MissingPerson> => {
    const response = await apiClient.post('/cases', missingPersonData);
    return response.data;
  },

  // 실종자 정보 수정 - TODO: 백엔드에 PATCH 엔드포인트 구현 필요
  updateMissingPerson: async (id: string, missingPersonData: Partial<MissingPerson>): Promise<MissingPerson> => {
    const response = await apiClient.patch(`/cases/${id}`, missingPersonData);
    return response.data;
  },

  // 실종자 삭제 - TODO: 백엔드에 DELETE 엔드포인트 구현 필요
  deleteMissingPerson: async (id: string): Promise<void> => {
    await apiClient.delete(`/cases/${id}`);
  },

  // 연락처 등록 - TODO: 백엔드에 /cases/{caseId}/contacts 엔드포인트 구현 필요, CaseContact 엔티티와 매핑
  addContact: async (caseId: string, contactData: any): Promise<void> => {
    await apiClient.post(`/cases/${caseId}/contacts`, contactData);
  },

  // 이동 예측 조회 - TODO: 백엔드에 /cases/{caseId}/prediction 엔드포인트 구현 필요, AI 모델 연동 필요
  getPrediction: async (caseId: string): Promise<any> => {
    const response = await apiClient.get(`/cases/${caseId}/prediction`);
    return response.data;
  },

  // 예측 저장 - TODO: 백엔드에 /cases/{caseId}/predictions 엔드포인트 구현 필요, MovementPrediction 엔티티와 매핑, AI 모델에서 받은 데이터 형식 정의 필요
  savePrediction: async (caseId: string, predictionData: any): Promise<void> => {
    await apiClient.post(`/cases/${caseId}/predictions`, predictionData);
  },
};
