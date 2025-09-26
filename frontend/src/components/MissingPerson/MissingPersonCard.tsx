import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateElapsedTime, calculateElapsedTimeFromCreated } from '../../utils/timeUtils';
import { getTargetCodeLabel } from '../../utils/targetCodeUtils';
import type { MissingPersonListItem } from '../../types/missingPerson';

interface MissingPersonCardProps {
  person: MissingPersonListItem;
}

const MissingPersonCard: React.FC<MissingPersonCardProps> = ({ person }) => {
  const navigate = useNavigate();
  
  // 24시간 이내인지 확인하는 함수
  const isWithin24Hours = (occurDate: string) => {
    const now = new Date();
    const occurTime = new Date(
      parseInt(occurDate.substring(0, 4)),
      parseInt(occurDate.substring(4, 6)) - 1,
      parseInt(occurDate.substring(6, 8)),
      12, 0, 0
    );
    const diffMs = now.getTime() - occurTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  // 경과시간 계산 함수 - 24시간 이내는 createdAt 기준, 초과는 occurDate 기준
  const calculateElapsedTimeForPerson = () => {
    if (isWithin24Hours(person.occurDate) && person.createdAt) {
      return calculateElapsedTimeFromCreated(person.createdAt);
    } else {
      return calculateElapsedTime(person.occurDate);
    }
  };

  const [elapsedTime, setElapsedTime] = useState(calculateElapsedTimeForPerson());

  // 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTimeForPerson());
    }, 1000);

    return () => clearInterval(interval);
  }, [person.occurDate, person.createdAt]);


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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* 왼쪽 프로필 사진 영역 - 높이 조정 */}
        <div className="flex-shrink-0 w-28 h-32 sm:w-36 sm:h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-start p-3">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <img
              src={person.photoUrl}
              alt={person.name}
              className="w-full h-full object-cover rounded-lg shadow-sm"
            />
            <div className="absolute -top-1 -right-1">
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          {/* 경과시간 - 이미지 밑에 표시 */}
          <div className="mt-2 w-full text-center">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-800 shadow-sm border border-white/50">
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
        
        {/* 오른쪽 정보 영역 - 더 컴팩트하게 */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1">
            {/* 헤더: 이름, 나이, 성별, 대상 */}
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {person.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {person.age || person.ageNow || 'N/A'}세
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {person.sexCode === '1' ? '남성' : person.sexCode === '2' ? '여성' : 'N/A'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  person.targetCode === '010' ? 'bg-green-100 text-green-700' : // 정상아동
                  person.targetCode === '020' ? 'bg-blue-100 text-blue-700' : // 가출인
                  person.targetCode === '040' ? 'bg-purple-100 text-purple-700' : // 시설보호무연고자
                  person.targetCode === '060' || person.targetCode === '061' || person.targetCode === '062' ? 'bg-orange-100 text-orange-700' : // 지적장애인
                  person.targetCode === '070' ? 'bg-red-100 text-red-700' : // 치매질환자
                  'bg-gray-100 text-gray-700' // 불상(기타)
                }`}>
                  {getTargetCodeLabel(person.targetCode)}
                </span>
              </div>
            </div>
            
            {/* 실종 정보 - 컴팩트하게 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs block">발생일</span>
                  <span className="text-gray-900 font-semibold text-sm">
                    {person.occurDate.substring(0, 4)}-{person.occurDate.substring(4, 6)}-{person.occurDate.substring(6, 8)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block">발생장소</span>
                  <span className="text-gray-900 font-semibold text-sm truncate">{person.occurAddress || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* 상세 정보 - 컴팩트하게 통합 */}
            {(person.height || person.weight || person.frmDscd || person.faceshpeDscd || person.hairshpeDscd || person.haircolrDscd || person.alldressingDscd) && (
              <div className="space-y-2 mb-3">
                {/* 신체 정보 */}
                {(person.height || person.weight) && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 text-xs">신체:</span>
                    {person.height && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        키 {person.height}cm
                      </span>
                    )}
                    {person.weight && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        체중 {person.weight}kg
                      </span>
                    )}
                  </div>
                )}

                {/* 외모 특징 */}
                {(person.frmDscd || person.faceshpeDscd || person.hairshpeDscd || person.haircolrDscd) && (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-gray-500 text-xs">외모:</span>
                    {person.frmDscd && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        {person.frmDscd}
                      </span>
                    )}
                    {person.faceshpeDscd && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        {person.faceshpeDscd}
                      </span>
                    )}
                    {person.hairshpeDscd && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        {person.hairshpeDscd}
                      </span>
                    )}
                    {person.haircolrDscd && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                        {person.haircolrDscd}
                      </span>
                    )}
                  </div>
                )}

                {/* 복장 정보 */}
                {person.alldressingDscd && person.alldressingDscd !== '불상' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 text-xs">복장:</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                      {person.alldressingDscd}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* 버튼들 - 컴팩트하게 */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => {
                  navigate(`/report/${person.id}`);
                }}
                className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors text-xs font-semibold flex-1"
              >
                📝 신고
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
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold flex-1"
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
