// 도보 예측 범위 컴포넌트
import React, { useEffect, useRef } from 'react';
import { Map, Circle, CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { MissingPerson } from '../../types/missingPerson';
import { getDynamicWalkingDistance } from '../../utils/timeUtils';

interface WalkingRangeMapProps {
  person: MissingPerson;
  className?: string;
}

const WalkingRangeMap: React.FC<WalkingRangeMapProps> = ({ person, className = "" }) => {
  const mapRef = useRef<kakao.maps.Map>(null);
  const [walkingDistance, setWalkingDistance] = React.useState(
    getDynamicWalkingDistance(person.age, person.lastSeenDate)
  );
  
  // 실시간으로 도보 범위 업데이트 (1분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setWalkingDistance(getDynamicWalkingDistance(person.age, person.lastSeenDate));
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [person.age, person.lastSeenDate]);

  const radiusText = `${(walkingDistance / 1000).toFixed(1)}km`;
  const areaText = `${(Math.PI * walkingDistance * walkingDistance / 1000000).toFixed(1)}km²`;

  useEffect(() => {
    if (mapRef.current && person.coordinates) {
      // 기존 지도에서 받은 실종 장소 좌표 사용
      const center = new window.kakao.maps.LatLng(
        person.coordinates.lat, 
        person.coordinates.lng
      );
      mapRef.current.setCenter(center);
      
      // 도보 범위가 잘 보이도록 줌 레벨 조정 (나이 기반)
      const zoomLevel = walkingDistance > 5000 ? 8 : 
                       walkingDistance > 3000 ? 9 : 
                       walkingDistance > 2000 ? 10 : 11;
      mapRef.current.setLevel(zoomLevel);
    }
  }, [person.coordinates, walkingDistance]);

  return (
    <div className={`bg-gray-50 rounded-lg overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="p-3 bg-blue-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-blue-900">예상 이동 범위</h3>
          <div className="text-sm text-blue-700">
            반경 {radiusText} • 면적 {areaText}
          </div>
        </div>
      </div>
      
      {/* 미니 지도 */}
      <div className="h-48 w-full">
        <Map
          center={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
          style={{ width: '100%', height: '100%' }}
          level={walkingDistance > 5000 ? 8 : 
                 walkingDistance > 3000 ? 9 : 
                 walkingDistance > 2000 ? 10 : 11}
          onCreate={(map) => {
            mapRef.current = map;
          }}
        >
          {/* 실종 장소 마커 (정확한 좌표에 표시) */}
          <CustomOverlayMap
            position={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
            yAnchor={1}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#ef4444',
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            />
          </CustomOverlayMap>
          
          {/* 도보 범위 원 (나이 기반) */}
          <Circle
            center={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
            radius={walkingDistance}
            strokeWeight={2}
            strokeColor="#3b82f6"
            strokeOpacity={0.8}
            strokeStyle="solid"
            fillColor="#3b82f6"
            fillOpacity={0.1}
          />
        </Map>
      </div>
      
      {/* 범례 */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>실종 장소</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 opacity-30"></div>
            <span>예상 이동 범위</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkingRangeMap;
