// 신고 API
import { apiClient } from './client';
import type { ReportFormData, ReportSubmission } from '../types/report';

export const reportApi = {
  // 신고 제출
  submitReport: async (reportData: ReportFormData): Promise<ReportSubmission> => {
    const formData = new FormData();

    // 기본 정보 추가
    formData.append('missingPersonId', reportData.missingPersonId);
    formData.append('reporterName', reportData.reporterName);
    formData.append('reporterPhone', reportData.reporterPhone);
    if (reportData.reporterEmail) {
      formData.append('reporterEmail', reportData.reporterEmail);
    }
    formData.append('sightingDate', reportData.sightingDate);
    formData.append('sightingTime', reportData.sightingTime);
    formData.append('sightingLocation', reportData.sightingLocation);
    formData.append('latitude', reportData.latitude.toString());
    formData.append('longitude', reportData.longitude.toString());
    formData.append('certainty', reportData.certainty);
    formData.append('description', reportData.description);
    if (reportData.additionalInfo) {
      formData.append('additionalInfo', reportData.additionalInfo);
    }

    // 파일 첨부
    if (reportData.photos) {
      reportData.photos.forEach((photo, index) => {
        formData.append(`photos[${index}]`, photo);
      });
    }

    if (reportData.videos) {
      reportData.videos.forEach((video, index) => {
        formData.append(`videos[${index}]`, video);
      });
    }
    
    const response = await apiClient.post('/reports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // 신고 조회
  getReport: async (reportId: string): Promise<ReportSubmission> => {
    const response = await apiClient.get(`/reports/${reportId}`);
    return response.data;
  },

  // 사용자의 신고 목록 조회
  getUserReports: async (): Promise<ReportSubmission[]> => {
    const response = await apiClient.get('/reports/my');
    return response.data;
  },

  // 신고 상태 업데이트
  updateReportStatus: async (reportId: string, status: string): Promise<ReportSubmission> => {
    const response = await apiClient.patch(`/reports/${reportId}/status`, { status });
    return response.data;
  },
};