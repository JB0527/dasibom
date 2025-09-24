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
  const [elapsedHours, setElapsedHours] = React.useState(
    Math.floor((new Date().getTime() - new Date(person.lastSeenDate).getTime()) / (1000 * 60 * 60))
  );
  const [isUserInteracting, setIsUserInteracting] = React.useState(false);
  
  // 실시간으로 도보 범위와 경과 시간 업데이트 (1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setWalkingDistance(getDynamicWalkingDistance(person.age, person.lastSeenDate));
      setElapsedHours(Math.floor((new Date().getTime() - new Date(person.lastSeenDate).getTime()) / (1000 * 60 * 60)));
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [person.age, person.lastSeenDate]);

  const radiusText = `${(walkingDistance / 1000).toFixed(1)}km`;
  const areaText = `${(Math.PI * walkingDistance * walkingDistance / 1000000).toFixed(1)}km²`;

  // 초기 지도 설정 (한 번만 실행)
  useEffect(() => {
    if (mapRef.current && person.coordinates && !isUserInteracting) {
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
  }, [person.coordinates]); // walkingDistance 의존성 제거

  // 사용자 상호작용 감지
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      
      const handleDragStart = () => setIsUserInteracting(true);
      const handleZoomStart = () => setIsUserInteracting(true);
      
      // 사용자가 드래그나 줌을 시작하면 상호작용 상태로 설정
      kakao.maps.event.addListener(map, 'dragstart', handleDragStart);
      kakao.maps.event.addListener(map, 'zoom_start', handleZoomStart);
      
      return () => {
        kakao.maps.event.removeListener(map, 'dragstart', handleDragStart);
        kakao.maps.event.removeListener(map, 'zoom_start', handleZoomStart);
      };
    }
  }, [mapRef.current]);

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
          {/* 실종자 마커 (실제 지도와 동일한 스타일) */}
          <CustomOverlayMap
            position={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
            yAnchor={1}
            xAnchor={0.5}
          >
            <div className="relative">
              {/* 프로필 이미지 */}
              <img
                src={person.photo || `https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=${person.name.charAt(0)}`}
                alt={person.name}
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-lg"
              />
              
              {/* 실시간 경과 시간 표시 (프로필 이미지 아래) */}
              <div className="mt-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full text-center font-mono shadow-md">
                {elapsedHours}h
              </div>
            </div>
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
