import { useState, useEffect } from 'react';
import type { MissingPerson } from '../types/missingPerson';
import { calculateElapsedTime } from '../utils/timeUtils';

export const useMarkerInteraction = (mapInstance: any, missingPersons: MissingPerson[]) => {
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedPersonElapsedTime, setSelectedPersonElapsedTime] = useState<{ formatted: string } | null>(null);

  // 선택된 실종자의 경과시간을 실시간으로 업데이트
  useEffect(() => {
    if (!selectedPerson) return;
    
    const interval = setInterval(() => {
      setSelectedPersonElapsedTime(calculateElapsedTime(selectedPerson.lastSeenDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedPerson]);

  // 겹친 마커들을 찾는 함수
  const findNearbyMarkers = (clickedPerson: MissingPerson) => {
    if (!mapInstance) return [];
    
    const currentLevel = mapInstance.getLevel();
    // 지도 레벨에 따른 거리 임계값 조정
    const threshold = Math.max(0.001, 0.01 / Math.pow(2, currentLevel - 3));
    
    return missingPersons.filter(person => {
      if (person.id === clickedPerson.id) return false;
      
      // 두 마커 간의 거리 계산 (위도/경도 차이)
      const latDiff = Math.abs(person.coordinates.lat - clickedPerson.coordinates.lat);
      const lngDiff = Math.abs(person.coordinates.lng - clickedPerson.coordinates.lng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      return distance < threshold;
    });
  };

  const handleMarkerClick = (person: MissingPerson) => {
    console.log('마커 클릭됨:', person);
    
    // 겹친 마커들 찾기
    const nearbyMarkers = findNearbyMarkers(person);
    
    if (nearbyMarkers.length > 0 && mapInstance) {
      // 겹친 마커들이 있으면 자동 줌인
      console.log('겹친 마커들 발견, 자동 줌인:', nearbyMarkers.length);
      
      // 클릭한 마커 위치로 중심 이동하면서 줌인
      const currentLevel = mapInstance.getLevel();
      const newLevel = Math.max(1, currentLevel - 2); // 2단계 줌인
      
      mapInstance.setLevel(newLevel, {
        anchor: new window.kakao.maps.LatLng(person.coordinates.lat, person.coordinates.lng)
      });
      
      // 줌인 후 잠시 대기 후 마커 선택
      setTimeout(() => {
        setSelectedPerson(person);
        setSelectedMarkerId(person.id);
        setIsModalOpen(true);
      }, 500);
    } else {
      // 겹친 마커가 없으면 바로 모달 표시
      setSelectedPerson(person);
      setSelectedMarkerId(person.id);
      setIsModalOpen(true);
    }
    
    console.log('모달 상태:', isModalOpen);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
    setSelectedMarkerId(null);
    setSelectedPersonElapsedTime(null);
  };

  return {
    selectedPerson,
    isModalOpen,
    selectedMarkerId,
    selectedPersonElapsedTime,
    handleMarkerClick,
    handleCloseModal
  };
};
