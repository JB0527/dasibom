// 실종자 관련 타입 정의

// 지도용 마커 정보 (간단한 정보) - MissingPersonListItem으로 통합됨
// export interface MissingPerson { ... } // 더 이상 사용하지 않음

// 상세 정보 (완전한 정보) - API에서 제공하는 모든 필드 포함
export interface MissingPersonDetail {
  id: number;
  status: 'OPEN' | 'CLOSED';
  name: string;
  occurDate: string; // YYYYMMDD 형식
  occurAddress: string;
  sexCode: string; // 1/2
  age: number;
  ageNow: number;
  targetCode: string;
  height: number; // cm
  weight: number; // kg
  photoUrl: string;
  
  // API에서 제공하는 추가 정보들
  alldressingDscd?: string; // 복장
  frmDscd: string; // 체형
  faceshpeDscd: string; // 얼굴형
  hairshpeDscd: string; // 머리형
  haircolrDscd: string; // 머리색
  tknphotolength: number; // 사진길이
  createdAt: string;
  updatedAt: string;
}

// 실제 API 응답 타입 (API 명세에 맞춤)
export interface ApiMissingPerson {
  id: number;
  occrde: string; // 발생일 (YYYYMMDD)
  nm: string; // 이름
  sexdstnDscd: string; // 성별
  age: number; // 나이
  ageNow: number; // 현재나이
  wrtngTrgetDscd: string; // 대상코드
  occrAdres: string; // 발생주소
  alldressingDscd?: string; // 복장 (선택적)
  height: number; // 키
  bdwgh: number; // 체중
  frmDscd: string; // 체형
  faceshpeDscd: string; // 얼굴형
  hairshpeDscd: string; // 머리형
  haircolrDscd: string; // 머리색
  tknphotolength: number; // 사진길이
  fileUrl: string; // 실제 사진 URL
  msspsnIdntfccd: number; // 실종자 식별 코드
  lastCheckedAt: string; // 마지막 확인 시간
  sourceUpdatedAt: string; // 소스 업데이트 시간
  caseStatus: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

// 목록용 정보 (상세 정보 포함)
export interface MissingPersonListItem {
  id: number;
  status: 'OPEN' | 'CLOSED';
  name: string;
  occurDate: string; // YYYYMMDD 형식
  occurAddress: string;
  sexCode: string; // 1/2
  age: number;
  ageNow: number;
  targetCode: string;
  photoUrl: string; // 기본사진 URL
  createdAt: string; // 데이터 생성 시간 (경과시간 계산용)
  
  // 상세 정보 (API에서 제공하는 모든 필드)
  height?: number; // 키
  weight?: number; // 체중
  alldressingDscd?: string; // 복장
  frmDscd?: string; // 체형
  faceshpeDscd?: string; // 얼굴형
  hairshpeDscd?: string; // 머리형
  haircolrDscd?: string; // 머리색
  tknphotolength?: number; // 사진길이
  updatedAt?: string; // 업데이트 시간
}

// 지도용 확장 정보 (지도에서만 사용)
export interface MissingPersonMapItem extends MissingPersonListItem {
  point: { lat: number; lon: number }; // 지도용 좌표 정보
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
  coordinates: { lat: number; lon: number };
}
