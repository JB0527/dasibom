// 실종접수 관련 타입 정의

export interface CertaintyOption {
  value: 'UNSURE' | 'LIKELY' | 'CONFIRMED';
  label: string;
  description: string;
  color: string;
}

// 실종접수 API 타입 정의
export interface MissingPersonReportData {
  caseId: number;
  reportedAt?: string; // ISO8601, 기본 now
  location: string;
  certainty: 'UNSURE' | 'LIKELY' | 'CONFIRMED';
  description?: string;
  attachmentUrl?: string;
}

export interface MissingPersonReportResponse {
  id: string;
  caseId: number;
  reportedAt: string;
  location: string;
  certainty: 'UNSURE' | 'LIKELY' | 'CONFIRMED';
  description?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}