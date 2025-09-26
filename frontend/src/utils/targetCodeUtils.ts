// 대상코드 매핑 유틸리티

export interface TargetCodeMapping {
  code: string;
  label: string;
  description: string;
}

// 대상코드 매핑 테이블
export const TARGET_CODE_MAPPINGS: Record<string, TargetCodeMapping> = {
  '010': {
    code: '010',
    label: '정상아동',
    description: '18세 미만'
  },
  '020': {
    code: '020',
    label: '가출인',
    description: ''
  },
  '040': {
    code: '040',
    label: '시설보호무연고자',
    description: ''
  },
  '060': {
    code: '060',
    label: '지적장애인',
    description: ''
  },
  '061': {
    code: '061',
    label: '지적장애인',
    description: '18세 미만'
  },
  '062': {
    code: '062',
    label: '지적장애인',
    description: '18세 이상'
  },
  '070': {
    code: '070',
    label: '치매질환자',
    description: ''
  },
  '080': {
    code: '080',
    label: '불상',
    description: '기타'
  }
};

/**
 * 대상코드를 사람이 읽기 쉬운 텍스트로 변환
 * @param targetCode - 대상코드 (예: '010', '020' 등)
 * @returns 변환된 텍스트 또는 원본 코드
 */
export const getTargetCodeLabel = (targetCode: string | undefined | null): string => {
  if (!targetCode) return 'N/A';
  
  const mapping = TARGET_CODE_MAPPINGS[targetCode];
  if (!mapping) return targetCode; // 매핑이 없으면 원본 코드 반환
  
  return mapping.description 
    ? `${mapping.label}(${mapping.description})`
    : mapping.label;
};

/**
 * 대상코드의 상세 정보를 가져옴
 * @param targetCode - 대상코드
 * @returns 매핑 정보 또는 null
 */
export const getTargetCodeInfo = (targetCode: string | undefined | null): TargetCodeMapping | null => {
  if (!targetCode) return null;
  return TARGET_CODE_MAPPINGS[targetCode] || null;
};

/**
 * 모든 대상코드 목록을 가져옴
 * @returns 모든 대상코드 매핑 배열
 */
export const getAllTargetCodes = (): TargetCodeMapping[] => {
  return Object.values(TARGET_CODE_MAPPINGS);
};
