import React, { useState, useEffect } from 'react';
import { getTodayFormatted } from '../../utils/dateUtils';
import { getMissingStatusData, type MissingStatusData } from '../../utils/missingPersonUtils';

interface MissingStatusBoardProps {
  date?: string;
  receivedCount?: number;
  resolvedCount?: number;
  reportCount?: number;
}

const MissingStatusBoard: React.FC<MissingStatusBoardProps> = ({
  date,
  receivedCount,
  resolvedCount,
  reportCount
}) => {
  const [statusData, setStatusData] = useState<MissingStatusData>({
    receivedCount: 0,
    resolvedCount: 0,
    reportCount: 0
  });

  // 컴포넌트 마운트 시 더미 데이터 로드
  useEffect(() => {
    const data = getMissingStatusData();
    setStatusData(data);
  }, []);

  // Props가 전달되면 Props 사용, 아니면 상태 데이터 사용
  const finalDate = date || getTodayFormatted();
  const finalReceivedCount = receivedCount ?? statusData.receivedCount;
  const finalResolvedCount = resolvedCount ?? statusData.resolvedCount;
  const finalReportCount = reportCount ?? statusData.reportCount;
  return (
    <div className="p-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {finalDate} 기준 실종 현황판
        </h3>
        <div className="space-y-2 text-sm">
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
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          우리가 함께 찾는 시간이 가족과 함께하는 시간을 단축시킵니다
        </p>
      </div>
    </div>
  );
};

export default MissingStatusBoard;
