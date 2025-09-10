import React, { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import PersonInfoModal from '../Modal/PersonInfoModal';

// 임시 데이터 (나중에 API에서 가져올 예정)
const mockMissingPersons = [
  {
    id: '1',
    name: '왕성민',
    age: 26,
    nationality: '내국인',
    height: 170,
    weight: 60,
    build: '보통 이상',
    faceShape: '갸름한형',
    lastSeenDate: '2025년 08월30일',
    lastSeenLocation: '서울 중구 을지로 281',
    elapsedTime: '00:23',
    coordinates: { lat: 37.5665, lng: 126.9780 }
  }
];

const MapContainer: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);

  // 카카오맵 동적 로드 (새로운 방식)
  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    
    // 이미 로드되어 있다면 즉시 설정
    if (window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
      console.log('카카오맵 이미 로드됨');
      setIsKakaoLoaded(true);
      return;
    }

    // 중복 로드 방지
    if (document.querySelector(`script[src*="dapi.kakao.com"]`)) {
      console.log('카카오맵 스크립트 이미 존재');
      // 기존 스크립트가 있다면 kakao.maps.load() 사용
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(() => {
          console.log('기존 카카오맵 로드 완료');
          setIsKakaoLoaded(true);
        });
      } else {
        setIsKakaoLoaded(true);
      }
      return;
    }

    console.log('카카오맵 스크립트 로드 시작');
    
    // 카카오맵 스크립트 동적 로드 (공식 문서 방식: autoload=false 사용)
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      console.log('카카오맵 스크립트 로드 완료');
      // 공식 문서에 따른 올바른 방법: kakao.maps.load() 사용
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(() => {
          console.log('카카오맵 로드 완료');
          setIsKakaoLoaded(true);
        });
      } else {
        console.error('kakao.maps.load 함수를 찾을 수 없음');
        setIsKakaoLoaded(true);
      }
    };
    
    script.onerror = () => {
      console.error('카카오맵 스크립트 로드 실패');
      setIsKakaoLoaded(true); // 실패해도 지도 표시
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 컴포넌트 언마운트 시 스크립트 정리
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleMarkerClick = (person: any) => {
    console.log('마커 클릭됨:', person);
    setSelectedPerson(person);
    setIsModalOpen(true);
    console.log('모달 상태:', isModalOpen);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  const handleReport = () => {
    // 신고 페이지로 이동
    console.log('신고하기 클릭:', selectedPerson);
    // router.push(`/report/${selectedPerson.id}`);
  };

  if (!isKakaoLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
          <p className="text-sm text-gray-400 mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* 카카오맵 */}
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }} // 서울 중심
        style={{ width: '100%', height: '100%' }}
        level={3}
      >
        {/* 실종자 마커들 */}
        {mockMissingPersons.map((person) => (
          <MapMarker
            key={person.id}
            position={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
            onClick={() => handleMarkerClick(person)}
            image={{
              src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
              size: { width: 24, height: 35 },
              options: {
                offset: { x: 12, y: 35 }
              }
            }}
          />
        ))}
      </Map>

      {/* 실종자 정보 모달 */}
      <PersonInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        person={selectedPerson}
        onReport={handleReport}
      />
    </div>
  );
};

export default MapContainer;
