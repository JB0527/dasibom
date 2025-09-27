// 실종접수 관련 훅
import { useState } from 'react';
import { missingPersonApi } from '../api/missingPerson';
import type { MissingPersonReportData, MissingPersonReportResponse } from '../types/report';

export const useMissingPersonReport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMissingPersonReport = async (reportData: MissingPersonReportData | FormData): Promise<MissingPersonReportResponse | null> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await missingPersonApi.submitMissingPersonReport(reportData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '실종접수 제출 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitMissingPersonReport,
    isSubmitting,
    error,
    clearError: () => setError(null),
  };
};
