import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateElapsedTimeFromCreated, getDynamicWalkingDistance } from '../../utils/timeUtils';
import type { MissingPersonListItem } from '../../types/missingPerson';
import ElapsedTimeBadge from '../Common/ElapsedTimeBadge';

interface MissingPersonCardProps {
  person: MissingPersonListItem;
}

const MissingPersonCard: React.FC<MissingPersonCardProps> = ({ person }) => {
  const navigate = useNavigate();
  
  const [elapsedTime, setElapsedTime] = useState(calculateElapsedTimeFromCreated(person.createdAt));
  const [walkingDistance, setWalkingDistance] = useState(
    getDynamicWalkingDistance(person.occurDate)
  );

  // 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTimeFromCreated(person.createdAt));
      setWalkingDistance(getDynamicWalkingDistance(person.occurDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [person.createdAt, person.occurDate]);

  // 컴포넌트 마운트 시 상세 정보 가져오기

  // 경과 시간에 따른 상태 표시
  const getStatusInfo = () => {
    const hoursElapsed = elapsedTime.hours;
    
    if (hoursElapsed <= 6) {
      return { label: '긴급', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (hoursElapsed <= 24) {
      return { label: '신고', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    } else {
      return { label: '장기', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const statusInfo = getStatusInfo();
  const radiusText = `${(walkingDistance / 1000).toFixed(1)}km`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* 왼쪽 프로필 사진 영역 */}
        <div className="relative flex-shrink-0 w-20 h-20 m-3">
          <img
            src={person.photoUrl}
            alt={person.name}
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute -top-1 -right-1">
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          {/* 경과시간 - 프로필 이미지 밑에 */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <ElapsedTimeBadge elapsedTime={elapsedTime} variant="compact" />
          </div>
        </div>
        
        {/* 오른쪽 정보 영역 */}
        <div className="flex-1 p-4 pr-6 flex flex-col justify-between">
          {/* 상단 정보 */}
          <div>
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {person.name}
                <span className="text-sm text-gray-500 font-normal ml-2">
                  ({person.age || person.ageNow || 'N/A'}세, {person.sexCode === '1' ? '남성' : person.sexCode === '2' ? '여성' : 'N/A'})
                </span>
              </h3>
            </div>
            
            {/* 기본 정보 - 2열로 정리 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
              <div>
                <span className="text-gray-500">상태:</span>
                <span className="ml-1 text-gray-900">{person.status === 'OPEN' ? '진행중' : '해제'}</span>
              </div>
              <div>
                <span className="text-gray-500">대상코드:</span>
                <span className="ml-1 text-gray-900">{person.targetCode || 'N/A'}</span>
              </div>
            </div>
            
            {/* 실종 정보 */}
            <div className="border-t pt-2 mb-3">
              <div className="text-sm mb-1">
                <span className="text-gray-500">발생일:</span>
                <span className="ml-1 text-gray-900">
                  {person.occurDate.substring(0, 4)}-{person.occurDate.substring(4, 6)}-{person.occurDate.substring(6, 8)}
                </span>
              </div>
              <div className="text-sm mb-1">
                <span className="text-gray-500">발생장소:</span>
                <span className="ml-1 text-gray-900">{person.occurAddress || 'N/A'}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">예상범위:</span>
                <span className="ml-1 text-blue-600 font-semibold">{radiusText}</span>
              </div>
            </div>
          </div>
          
          {/* 하단 버튼 - 오른쪽 정렬 */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                navigate(`/report/${person.id}`);
              }}
              className="bg-blue-500 text-white py-1.5 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              신고하기
            </button>
            <button
              onClick={() => {
                const shareText = `${person.name} 실종자 정보\n상태: ${person.status === 'OPEN' ? '진행중' : '해제'}\n발생일: ${person.occurDate.substring(0, 4)}-${person.occurDate.substring(4, 6)}-${person.occurDate.substring(6, 8)}\n발생장소: ${person.occurAddress || 'N/A'}`;
                
                if (navigator.share) {
                  navigator.share({
                    title: '실종자 정보',
                    text: shareText,
                    url: window.location.href
                  });
                } else {
                  navigator.clipboard.writeText(shareText).then(() => {
                    alert('실종자 정보가 클립보드에 복사되었습니다.');
                  });
                }
              }}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              공유
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MissingPersonCard };
