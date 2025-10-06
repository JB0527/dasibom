// 실종자 API
import { apiClient } from './client';
import type { MissingPersonDetail, MissingPersonListItem, ApiMissingPerson } from '../types/missingPerson';
import type { MissingPersonReportData, MissingPersonReportResponse } from '../types/report';

// API 응답을 MissingPersonListItem으로 변환 (상세 정보 포함)
const convertApiResponse = (apiPerson: ApiMissingPerson): MissingPersonListItem => {
  return {
    id: apiPerson.id,
    status: apiPerson.caseStatus,
    name: apiPerson.nm,
    occurDate: apiPerson.occrde,
    occurAddress: apiPerson.occrAdres,
    sexCode: apiPerson.sexdstnDscd === '남자' ? '1' : '2',
    age: apiPerson.age,
    ageNow: apiPerson.ageNow,
    targetCode: apiPerson.wrtngTrgetDscd,
    photoUrl: apiPerson.fileUrl || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#4F46E5"/><text x="40" y="45" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="bold">${apiPerson.nm.charAt(0)}</text></svg>`)}`, // 실제 사진 URL 또는 기본사진 생성
    createdAt: apiPerson.createdAt, // 데이터 생성 시간 추가
    
    // 상세 정보 포함
    height: apiPerson.height,
    weight: apiPerson.bdwgh,
    alldressingDscd: apiPerson.alldressingDscd,
    frmDscd: apiPerson.frmDscd,
    faceshpeDscd: apiPerson.faceshpeDscd,
    hairshpeDscd: apiPerson.hairshpeDscd,
    haircolrDscd: apiPerson.haircolrDscd,
    tknphotolength: apiPerson.tknphotolength,
    updatedAt: apiPerson.updatedAt
  };
};

// React Query가 자동으로 캐싱을 처리하므로 수동 캐싱 로직 제거됨

export const missingPersonApi = {
  // 실종사건 목록 조회 (React Query가 캐싱을 자동으로 처리)
  getCasesList: async (): Promise<MissingPersonListItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: ApiMissingPerson[] }>('/cases');
    const content = response.data.data || [];
    return content.map((apiPerson) => convertApiResponse(apiPerson));
  },

  // 특정 실종자 상세 정보 조회 (새로운 API)
  getCaseDetail: async (caseId: number): Promise<MissingPersonDetail> => {
    const response = await apiClient.get<{ success: boolean; data: ApiMissingPerson; error: any }>(`/cases/${caseId}`);
    const apiPerson = response.data.data;
    
    // ApiMissingPerson을 MissingPersonDetail로 변환 (모든 필드 포함)
    return {
      id: apiPerson.id,
      status: apiPerson.caseStatus,
      name: apiPerson.nm,
      occurDate: apiPerson.occrde,
      occurAddress: apiPerson.occrAdres,
      sexCode: apiPerson.sexdstnDscd === '남자' ? '1' : '2',
      age: apiPerson.age,
      ageNow: apiPerson.ageNow,
      targetCode: apiPerson.wrtngTrgetDscd,
      height: apiPerson.height,
      weight: apiPerson.bdwgh,
      photoUrl: apiPerson.fileUrl || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="#4F46E5"/><text x="40" y="45" text-anchor="middle" fill="white" font-family="Arial" font-size="32" font-weight="bold">${apiPerson.nm.charAt(0)}</text></svg>`)}`, // 실제 사진 URL 또는 기본사진 생성
      aiImageUrl: apiPerson.aiImageUrl, // AI가 예측한 이미지 URL
      speedKmh: apiPerson.speedKmh, // 예상 이동 속도
      
      // API에서 제공하는 모든 추가 정보들
      alldressingDscd: apiPerson.alldressingDscd,
      frmDscd: apiPerson.frmDscd,
      faceshpeDscd: apiPerson.faceshpeDscd,
      hairshpeDscd: apiPerson.hairshpeDscd,
      haircolrDscd: apiPerson.haircolrDscd,
      tknphotolength: apiPerson.tknphotolength,
      createdAt: apiPerson.createdAt,
      updatedAt: apiPerson.updatedAt
    };
  },

  // 실종접수 API
  submitMissingPersonReport: async (reportData: MissingPersonReportData | FormData): Promise<MissingPersonReportResponse> => {
    const config = reportData instanceof FormData 
      ? {
          headers: {
            // Content-Type을 명시하지 않음 - 브라우저가 자동으로 boundary 포함하여 설정
          },
        }
      : {};
    
    const response = await apiClient.post('/reports', reportData, config);
    return response.data;
  },
};
