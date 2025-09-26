// 실종자 API
import { apiClient } from './client';
import type { MissingPersonDetail, MissingPersonListItem, ApiMissingPerson } from '../types/missingPerson';

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

// API 요청 캐싱을 위한 변수
let casesListCache: { data: MissingPersonListItem[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// 중복 요청 방지를 위한 Promise 저장
let ongoingRequest: Promise<MissingPersonListItem[]> | null = null;

export const missingPersonApi = {
  // 실종사건 목록 조회 (통합 API - 지도용/목록용 모두 사용)
  getCasesList: async (): Promise<MissingPersonListItem[]> => {
    // 캐시가 있고 5분 이내라면 캐시 사용
    if (casesListCache && (Date.now() - casesListCache.timestamp) < CACHE_DURATION) {
      return casesListCache.data;
    }

    // 이미 진행 중인 요청이 있으면 해당 Promise 반환
    if (ongoingRequest) {
      return ongoingRequest;
    }
    
    // 새로운 요청 시작
    ongoingRequest = (async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: ApiMissingPerson[] }>('/cases');
        
        
        const content = response.data.data || [];
        const result = content.map((apiPerson) => convertApiResponse(apiPerson));
        
        // 결과를 캐시에 저장
        casesListCache = {
          data: result,
          timestamp: Date.now()
        };
        
        return result;
      } finally {
        // 요청 완료 후 ongoingRequest 초기화
        ongoingRequest = null;
      }
    })();
    
    return ongoingRequest;
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
};
