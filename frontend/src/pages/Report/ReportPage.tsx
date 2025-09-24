// 신고 페이지
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReportForm } from '../../components/Report/ReportForm';
import { useMissingPerson } from '../../hooks/useMissingPerson';
import type { MissingPerson } from '../../types/missingPerson';

interface ReportPageProps {
  missingPersonId?: string;
}

export const ReportPage: React.FC<ReportPageProps> = ({ missingPersonId }) => {
  const navigate = useNavigate();
  const { getMissingPersonById } = useMissingPerson();
  const [missingPerson, setMissingPerson] = useState<MissingPerson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const loadMissingPerson = async () => {
      if (missingPersonId) {
        try {
          const person = await getMissingPersonById(missingPersonId);
          setMissingPerson(person);
        } catch (error) {
          console.error('실종자 정보 로드 실패:', error);
        }
      }
      setIsLoading(false);
    };

    loadMissingPerson();
  }, [missingPersonId, getMissingPersonById]);

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">실종자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!missingPerson) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">실종자 정보를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 실종자 정보가 존재하지 않거나 삭제되었습니다.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">신고가 성공적으로 제출되었습니다</h1>
          <p className="text-gray-600 mb-6">
            귀중한 정보를 제공해주셔서 감사합니다. 
            신고 내용을 검토한 후 관련 기관에 전달하겠습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              홈으로 돌아가기
            </button>
            <p className="text-sm text-gray-500">
              신고 상태는 마이페이지에서 확인하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              돌아가기
            </button>
            <h1 className="text-lg font-semibold text-gray-900">실종자 신고</h1>
            <div className="w-20"></div> {/* 균형을 위한 빈 공간 */}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="py-6 pb-32">
        <ReportForm
          missingPerson={missingPerson}
          onSuccess={handleSuccess}
          onCancel={handleBack}
        />
      </div>
    </div>
  );
};
