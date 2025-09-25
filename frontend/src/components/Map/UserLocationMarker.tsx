import React, { memo } from 'react';

interface UserLocationMarkerProps {
  lat: number;
  lon: number;
  accuracy?: number;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = memo(({ 
  accuracy 
}) => {
  return (
    <div className="relative">
      {/* 정확도 원 (accuracy circle) */}
      {accuracy && (
        <div 
          className="absolute bg-blue-200 bg-opacity-30 border-2 border-blue-300 rounded-full animate-pulse"
          style={{
            width: `${Math.max(20, Math.min(200, accuracy * 2))}px`,
            height: `${Math.max(20, Math.min(200, accuracy * 2))}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        />
      )}
      
      {/* 현재 위치 마커 */}
      <div className="relative z-10">
        {/* 외부 원 */}
        <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-ping" />
        
        {/* 내부 점 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border border-white" />
      </div>
      
      {/* 위치 정보 툴팁 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
        내 위치
        {accuracy && (
          <div className="text-xs text-gray-300">
            정확도: ±{Math.round(accuracy)}m
          </div>
        )}
      </div>
    </div>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export default UserLocationMarker;
