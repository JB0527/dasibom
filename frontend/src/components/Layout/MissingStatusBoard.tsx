import React, { useState, useEffect } from 'react';
import { getTodayFormatted } from '../../utils/dateUtils';
import { getMissingStatusData, type MissingStatusData } from '../../utils/missingPersonUtils';
import { useStatusBoard } from '../../hooks/useOptimizedMissingPerson';

interface MissingStatusBoardProps {
  date?: string;
  receivedCount?: number;
  resolvedCount?: number;
  reportCount?: number;
  isMobile?: boolean;
  missingPersons?: any[]; // 외부에서 데이터를 전달받음
}

const MissingStatusBoard: React.FC<MissingStatusBoardProps> = ({
  date,
  receivedCount,
  resolvedCount,
  reportCount,
  isMobile = false
}) => {
  const { missingPersons, isLoading, error } = useStatusBoard();
  const [statusData, setStatusData] = useState<MissingStatusData>({
    receivedCount: 0,
    resolvedCount: 0,
    reportCount: 0
  });

  // 상태 데이터 계산
  useEffect(() => {
    if (missingPersons.length > 0) {
      const data = getMissingStatusData(missingPersons);
      setStatusData(data);
    }
  }, [missingPersons]);

  // Props가 전달되면 Props 사용, 아니면 상태 데이터 사용
  const finalDate = date || getTodayFormatted();
  const finalReceivedCount = receivedCount ?? statusData.receivedCount;
  const finalResolvedCount = resolvedCount ?? statusData.resolvedCount;
  const finalReportCount = reportCount ?? statusData.reportCount;
  return (
    <div className={isMobile ? "px-4 py-2 bg-white shadow-sm" : "p-4"}>
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg ${isMobile ? "p-3" : "p-4"}`}>
        <h3 className={`font-semibold text-gray-800 ${isMobile ? "text-sm mb-2" : "text-lg mb-3"}`}>
          {finalDate} 기준 실종 현황판
        </h3>
        <div className={`space-y-1 ${isMobile ? "text-xs" : "space-y-2 text-sm"}`}>
          <div className="flex justify-between">
            <span className="text-gray-600">실종 접수</span>
            <span className="font-semibold text-red-600">{finalReceivedCount}건</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">실종 해제</span>
            <span className="font-semibold text-green-600">{finalResolvedCount}건</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">실종자 신고</span>
            <span className="font-semibold text-blue-600">{finalReportCount}건</span>
          </div>
        </div>
        {!isMobile && (
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            우리가 함께 찾는 시간이 가족과 함께하는 시간을 단축시킵니다
          </p>
        )}
      </div>
    </div>
  );
};

export default MissingStatusBoard;
