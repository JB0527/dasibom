import React, { useEffect } from 'react';
import { Map, CustomOverlayMap } from 'react-kakao-maps-sdk';
import PersonInfoModal from '../Modal/PersonInfoModal';
import MissingPersonMarker from './MissingPersonMarker';
import UserLocationMarker from './UserLocationMarker';
import { useKakaoMap } from '../../hooks/useKakaoMap';
import { useMarkerInteraction } from '../../hooks/useMarkerInteraction';
import { useUserLocation } from '../../hooks/useUserLocation';
import { mockMissingPersons } from '../../data/mockMissingPersons';

const MapContainer: React.FC = () => {
  // 커스텀 훅 사용
  const { isKakaoLoaded, mapInstance, setMapInstance } = useKakaoMap();
  const {
    selectedPerson,
    isModalOpen,
    selectedMarkerId,
    handleMarkerClick,
    handleCloseModal,
    handleReport
  } = useMarkerInteraction(mapInstance, mockMissingPersons);
  
  // 사용자 위치 훅
  const { userLocation, isLoading: isLocationLoading, error: locationError, requestLocation } = useUserLocation();

  // 사용자 위치가 변경되면 지도 중심을 이동
  useEffect(() => {
    if (userLocation && mapInstance) {
      const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      mapInstance.setCenter(moveLatLon);
      mapInstance.setLevel(3); // 적절한 줌 레벨로 설정
    }
  }, [userLocation, mapInstance]);

  // 로딩 상태
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
        onCreate={setMapInstance}
      >
        {/* 사용자 현재 위치 마커 */}
        {userLocation && (
          <CustomOverlayMap
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            yAnchor={0.5}
            xAnchor={0.5}
          >
            <UserLocationMarker
              lat={userLocation.lat}
              lng={userLocation.lng}
              accuracy={userLocation.accuracy}
            />
          </CustomOverlayMap>
        )}

        {/* 실종자 커스텀 마커들 */}
        {mockMissingPersons.map((person) => (
          <CustomOverlayMap
            key={person.id}
            position={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
            yAnchor={1}
            xAnchor={0.5}
          >
            <MissingPersonMarker
              person={person}
              onClick={() => handleMarkerClick(person)}
              isSelected={selectedMarkerId === person.id}
            />
          </CustomOverlayMap>
        ))}
      </Map>

      {/* 위치 관련 UI 컨트롤 */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        {/* 위치 버튼 */}
        <button
          onClick={requestLocation}
          disabled={isLocationLoading}
          className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-colors"
          title="내 위치로 이동"
        >
          {isLocationLoading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* 위치 에러 메시지 */}
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm max-w-xs">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{locationError}</span>
            </div>
          </div>
        )}
      </div>

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