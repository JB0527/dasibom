// 실종자 관련 타입 정의

// 지도용 마커 정보 (간단한 정보) - MissingPersonListItem으로 통합됨
// export interface MissingPerson { ... } // 더 이상 사용하지 않음

// 상세 정보 (완전한 정보)
export interface MissingPersonDetail {
  id: number;
  status: 'OPEN' | 'CLOSED';
  endedAt?: string; // ISO8601 형식
  name: string;
  occurDate: string; // YYYYMMDD 형식
  occurAddress?: string;
  sexCode?: string; // 1/2
  age?: number;
  ageNow?: number;
  targetCode?: string;
  height?: number; // cm
  weight?: number; // kg
  photoUrl?: string;
}

// 목록용 간단한 정보 (통합 API용 - 지도/목록 모두 사용)
export interface MissingPersonListItem {
  id: number;
  status: 'OPEN' | 'CLOSED';
  name: string;
  occurDate: string; // YYYYMMDD 형식
  occurAddress?: string;
  sexCode?: string; // 1/2
  age?: number;
  ageNow?: number;
  targetCode?: string;
  photoUrl?: string;
  point: { lat: number; lon: number }; // 지도용 좌표 정보 추가
  prediction?: {
    predictedAt: string;
    horizonHours: number;
    speedKmh: number;
    center: { lat: number; lon: number };
    currentRadiusM: number;
  };
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

// 기존 타입과의 호환성을 위한 레거시 타입 (점진적 마이그레이션용)
export interface LegacyMissingPerson {
  id: string;
  name: string;
  age: number;
  nationality: string;
  height: number;
  weight: number;
  build: string;
  faceShape: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  photo: string;
  coordinates: { lat: number; lng: number };
}
