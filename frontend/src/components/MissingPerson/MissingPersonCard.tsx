import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateElapsedTime, getDynamicWalkingDistance } from '../../utils/timeUtils';
import type { MissingPersonListItem } from '../../types/missingPerson';

interface MissingPersonCardProps {
  person: MissingPersonListItem;
}

const MissingPersonCard: React.FC<MissingPersonCardProps> = ({ person }) => {
  const navigate = useNavigate();
  
  const [elapsedTime, setElapsedTime] = useState(calculateElapsedTime(person.occurDate));
  const [walkingDistance, setWalkingDistance] = useState(
    getDynamicWalkingDistance(person.occurDate)
  );

  // 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime(person.occurDate));
      setWalkingDistance(getDynamicWalkingDistance(person.occurDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [person.occurDate]);

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
      <div className="flex flex-col sm:flex-row">
        {/* 왼쪽 프로필 사진 영역 */}
        <div className="flex-shrink-0 w-full sm:w-56 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 sm:p-8">
          <div className="relative w-32 h-32 sm:w-48 sm:h-48">
            <img
              src={person.photoUrl}
              alt={person.name}
              className="w-full h-full object-cover rounded-xl shadow-lg"
            />
            <div className="absolute -top-2 -right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border shadow-sm ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          {/* 경과시간 - 사진 밑에 별도 영역 */}
          <div className="mt-4 w-full text-center">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold text-gray-800 shadow-sm border border-white/50">
              {elapsedTime.hours < 24 
                ? elapsedTime.formatted 
                : elapsedTime.hours < 168 
                  ? `${Math.floor(elapsedTime.hours / 24)}일 전`
                  : elapsedTime.hours < 720
                    ? `${Math.floor(elapsedTime.hours / 168)}주 전`
                    : elapsedTime.hours < 8760
                      ? `${Math.floor(elapsedTime.hours / 720)}개월 전`
                      : `${Math.floor(elapsedTime.hours / 8760)}년 전`
              }
            </div>
          </div>
        </div>
        
        {/* 오른쪽 정보 영역 */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col">
          <div className="flex-1">
            {/* 이름과 기본 정보 */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-3">
                {person.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {person.age || person.ageNow || 'N/A'}세
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {person.sexCode === '1' ? '남성' : person.sexCode === '2' ? '여성' : 'N/A'}
                </span>
              </div>
            </div>
            
            {/* 기본 정보 - 모바일에서는 세로로, 데스크톱에서는 2열로 */}
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-3 sm:space-y-0 text-sm mb-6">
              <div className="flex items-center bg-gray-50 rounded-lg p-3">
                <span className="text-gray-600 font-medium min-w-[3rem]">상태</span>
                <span className="ml-3 text-gray-900 font-semibold">
                  {person.status === 'OPEN' ? '진행중' : '해제'}
                </span>
              </div>
              <div className="flex items-center bg-gray-50 rounded-lg p-3">
                <span className="text-gray-600 font-medium min-w-[3rem]">대상코드</span>
                <span className="ml-3 text-gray-900 font-semibold">{person.targetCode || 'N/A'}</span>
              </div>
            </div>
            
            {/* 실종 정보 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">실종 정보</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-600 font-medium text-sm block">발생일</span>
                    <span className="text-gray-900 font-semibold">
                      {person.occurDate.substring(0, 4)}-{person.occurDate.substring(4, 6)}-{person.occurDate.substring(6, 8)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-600 font-medium text-sm block">발생장소</span>
                    <span className="text-gray-900 font-semibold">{person.occurAddress || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-600 font-medium text-sm block">예상범위</span>
                    <span className="text-blue-600 font-bold text-lg">{radiusText}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 버튼들 - 모바일에서는 세로로, 데스크톱에서는 오른쪽 하단에 고정 */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto sm:justify-end">
              <button
                onClick={() => {
                  navigate(`/report/${person.id}`);
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl flex-1 sm:flex-none sm:w-auto transform hover:scale-105"
              >
                📝 신고하기
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
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-semibold flex-1 sm:flex-none sm:w-auto transform hover:scale-105"
              >
                🔗 공유
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MissingPersonCard };
