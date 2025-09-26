import React, { useState, useEffect, memo } from 'react';
import { calculateElapsedTimeFromCreated } from '../../utils/timeUtils';
import type { MissingPersonMapItem } from '../../types/missingPerson';
import ElapsedTimeBadge from '../Common/ElapsedTimeBadge';

interface MissingPersonMarkerProps {
  person: MissingPersonMapItem;
  onClick: () => void;
  isSelected?: boolean;
}

const MissingPersonMarker: React.FC<MissingPersonMarkerProps> = memo(({
  person,
  onClick,
  isSelected = false
}) => {
  // createdAt 기준으로 경과시간 계산 (생성된 시간 기준)
  const [elapsedTime, setElapsedTime] = useState(
    calculateElapsedTimeFromCreated(person.createdAt)
  );
  
  // 실시간 경과시간 업데이트 (1초마다) - createdAt 기준
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTimeFromCreated(person.createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [person.createdAt]);


  // 기본 프로필 이미지 (더 예쁘게)
  const defaultPhoto = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="60" height="60" rx="30" fill="url(#grad)"/>
      <text x="30" y="38" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${person.name.charAt(0)}</text>
    </svg>
  `)}`;
  
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
            src={person.photoUrl || defaultPhoto}
            alt={person.name}
            className={`w-12 h-12 rounded-full border-3 object-cover shadow-lg ${
              isSelected ? 'border-blue-500' : 'border-white'
            }`}
          />
        </div>
        
        {/* 실시간 경과 시간 표시 (프로필 이미지 아래) */}
        <div className="mt-1 flex justify-center">
          <ElapsedTimeBadge elapsedTime={elapsedTime} variant="compact" />
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
});

MissingPersonMarker.displayName = 'MissingPersonMarker';

export default MissingPersonMarker;