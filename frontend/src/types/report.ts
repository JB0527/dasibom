// 신고 관련 타입 정의

export interface ReportFormData {
  // 실종자 정보
  missingPersonId: string;
  
  // 신고자 정보
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  
  // 목격 정보
  sightingDate: string;
  sightingTime: string;
  sightingLocation: string;
  latitude: number;
  longitude: number;
  
  // 목격 상세 정보
  certainty: 'high' | 'medium' | 'low';
  description: string;
  additionalInfo?: string;
  
  // 첨부 파일
  photos?: File[];
  videos?: File[];
}

export interface ReportSubmission {
  id: string;
  missingPersonId: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  sightingDate: string;
  sightingTime: string;
  sightingLocation: string;
  latitude: number;
  longitude: number;
  certainty: 'high' | 'medium' | 'low';
  description: string;
  additionalInfo?: string;
  status: 'pending' | 'reviewing' | 'confirmed' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CertaintyOption {
  value: 'high' | 'medium' | 'low';
  label: string;
  description: string;
  color: string;
}