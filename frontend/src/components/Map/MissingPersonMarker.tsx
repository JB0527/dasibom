import React, { useState, useEffect } from 'react';
import { calculateElapsedTime } from '../../utils/timeUtils';
import type { MissingPerson } from '../../types/missingPerson';

interface MissingPersonMarkerProps {
  person: MissingPerson;
  onClick: () => void;
  isSelected?: boolean;
}

const MissingPersonMarker: React.FC<MissingPersonMarkerProps> = ({
  person,
  onClick,
  isSelected = false
}) => {
  const [elapsedTime, setElapsedTime] = useState(calculateElapsedTime(person.lastSeenDate));
  
  // 실시간 경과시간 업데이트 (1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime(person.lastSeenDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [person.lastSeenDate]);

  // 나이와 실종 경과 시간을 고려한 동적 도보 거리 계산
  // const dynamicWalkingDistance = getDynamicWalkingDistance(person.age, person.lastSeenDate);

  // 기본 프로필 이미지
  const defaultPhoto = 'https://via.placeholder.com/60x60/4F46E5/FFFFFF?text=' + person.name.charAt(0);
  
  return (
    <div className="relative" style={{ zIndex: isSelected ? 1000 : 100 }}>
      {/* 마커 컨테이너 - 최상위 우선순위 */}
      <div 
        className="relative cursor-pointer transform transition-all duration-200 hover:scale-110 hover:z-50"
        style={{ zIndex: 10 }}
        onClick={onClick}
      >
        {/* 프로필 이미지 */}
        <div className="relative">
          <img
            src={person.photo || defaultPhoto}
            alt={person.name}
            className={`w-12 h-12 rounded-full border-3 object-cover shadow-lg ${
              isSelected ? 'border-blue-500' : 'border-white'
            }`}
          />
        </div>
        
        {/* 실시간 경과 시간 표시 (프로필 이미지 아래) */}
        <div className="mt-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full text-center font-mono shadow-md">
          {elapsedTime.formatted}
        </div>
        
        {/* 선택된 마커 강조 */}
        {isSelected && (
          <div 
            className="absolute -inset-2 rounded-full border-2 border-blue-500 animate-ping"
            style={{ zIndex: 5 }}
          />
        )}
      </div>
    </div>
  );
};

export default MissingPersonMarker;