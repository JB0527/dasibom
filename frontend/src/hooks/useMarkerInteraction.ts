import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MissingPersonMapItem } from '../types/missingPerson';
import { calculateElapsedTimeFromCreated } from '../utils/timeUtils';

export const useMarkerInteraction = (mapInstance: any, missingPersons: MissingPersonMapItem[]) => {
  const [selectedPerson, setSelectedPerson] = useState<MissingPersonMapItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedPersonElapsedTime, setSelectedPersonElapsedTime] = useState<{ formatted: string } | null>(null);

  // 선택된 실종자의 경과시간을 실시간으로 업데이트 (5초마다로 변경)
  useEffect(() => {
    if (!selectedPerson) return;
    
    // 즉시 한 번 계산
    setSelectedPersonElapsedTime(calculateElapsedTimeFromCreated(selectedPerson.createdAt));
    
    const interval = setInterval(() => {
      setSelectedPersonElapsedTime(calculateElapsedTimeFromCreated(selectedPerson.createdAt));
    }, 5000); // 1초에서 5초로 변경

    return () => clearInterval(interval);
  }, [selectedPerson?.createdAt]);

  // 겹친 마커들을 찾는 함수 (useCallback으로 안정화)
  const findNearbyMarkers = useCallback((clickedPerson: MissingPersonMapItem) => {
    if (!mapInstance || !window.kakao || !window.kakao.maps) return [];
    
    const currentLevel = mapInstance.getLevel();
    // 지도 레벨에 따른 거리 임계값 조정
    const threshold = Math.max(0.001, 0.01 / Math.pow(2, currentLevel - 3));
    
    return missingPersons.filter(person => {
      if (person.id === clickedPerson.id) return false;
      if (!person.point || !clickedPerson.point) return false;
      
      // 두 마커 간의 거리 계산 (위도/경도 차이)
      const latDiff = Math.abs(person.point.lat - clickedPerson.point.lat);
      const lngDiff = Math.abs(person.point.lon - clickedPerson.point.lon);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      return distance < threshold;
    });
  }, [mapInstance, missingPersons]);

  // 상태를 한 번에 업데이트하는 함수
  const updateModalState = useCallback((person: MissingPersonMapItem) => {
    setSelectedPerson(person);
    setSelectedMarkerId(person.id.toString());
    setIsModalOpen(true);
  }, []);

  const handleMarkerClick = useCallback((person: MissingPersonMapItem) => {
    // 겹친 마커들 찾기
    const nearbyMarkers = findNearbyMarkers(person);
    
    if (nearbyMarkers.length > 0 && mapInstance) {
      // 겹친 마커들이 있으면 자동 줌인
      
      // 클릭한 마커 위치로 중심 이동하면서 줌인
      const currentLevel = mapInstance.getLevel();
      const newLevel = Math.max(1, currentLevel - 2); // 2단계 줌인
      
      if (person.point && window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
        mapInstance.setLevel(newLevel, {
          anchor: new window.kakao.maps.LatLng(person.point.lat, person.point.lon)
        });
      }
      
      // 줌인 후 잠시 대기 후 마커 선택 (상태를 한 번에 업데이트)
      setTimeout(() => {
        updateModalState(person);
      }, 500);
    } else {
      // 겹친 마커가 없으면 바로 모달 표시
      updateModalState(person);
    }
  }, [findNearbyMarkers, mapInstance, updateModalState]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPerson(null);
    setSelectedMarkerId(null);
    setSelectedPersonElapsedTime(null);
  }, []);

  // 반환값을 useMemo로 메모이제이션
  return useMemo(() => ({
    selectedPerson,
    isModalOpen,
    selectedMarkerId,
    selectedPersonElapsedTime,
    handleMarkerClick,
    handleCloseModal
  }), [
    selectedPerson,
    isModalOpen,
    selectedMarkerId,
    selectedPersonElapsedTime,
    handleMarkerClick,
    handleCloseModal
  ]);
};
