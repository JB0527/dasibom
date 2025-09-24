// 신고 관련 훅
import { useState } from 'react';
import { reportApi } from '../api/report';
import type { ReportFormData, ReportSubmission } from '../types/report';

export const useReport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (reportData: ReportFormData): Promise<ReportSubmission | null> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await reportApi.submitReport(reportData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '신고 제출 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReport,
    isSubmitting,
    error,
    clearError: () => setError(null),
  };
};

export const useReportList = () => {
  const [reports, setReports] = useState<ReportSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await reportApi.getUserReports();
      setReports(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '신고 목록 조회 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    clearError: () => setError(null),
  };
};