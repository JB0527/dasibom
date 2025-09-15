import React, { useEffect } from 'react';
import { Map, CustomOverlayMap, MarkerClusterer } from 'react-kakao-maps-sdk';
import PersonInfoModal from '../Modal/PersonInfoModal';
import MissingPersonMarker from './MissingPersonMarker';
import UserLocationMarker from './UserLocationMarker';
import { useKakaoMap } from '../../hooks/useKakaoMap';
import { useMarkerInteraction } from '../../hooks/useMarkerInteraction';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useZoomLevel } from '../../hooks/useZoomLevel';
import { useClusterManager } from '../../hooks/useClusterManager';
import { mockMissingPersons } from '../../data/mockMissingPersons';
import { ZOOM_LEVELS, CLUSTER_STYLES } from '../../constants/mapConstants';

const MapContainer: React.FC = () => {
  // 커스텀 훅 사용
  const { isKakaoLoaded, isClusterLoaded, mapInstance, setMapInstance } = useKakaoMap();
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
  
  // 줌 레벨 추적
  const currentZoomLevel = useZoomLevel({ mapInstance });
  
  // 클러스터링 관리
  const { isClustering } = useClusterManager({
    currentZoomLevel,
  });

  // 사용자 위치가 변경되면 지도 중심을 이동
  useEffect(() => {
    if (userLocation && mapInstance) {
      const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      mapInstance.setCenter(moveLatLon);
      mapInstance.setLevel(ZOOM_LEVELS.STREET_VIEW); // 거리 단위 뷰로 설정
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
        level={ZOOM_LEVELS.STREET_VIEW}
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

        {/* 실종자 마커들 */}
        {isClustering ? (
          // 클러스터링 모드: MarkerClusterer 사용
          <MarkerClusterer
            averageCenter={true}
            minLevel={1}
            gridSize={60}
            disableClickZoom={false}
            styles={CLUSTER_STYLES}
          >
            {mockMissingPersons.map((person) => (
              <CustomOverlayMap
                key={person.id}
                position={{ lat: person.coordinates.lat, lng: person.coordinates.lng }}
                yAnchor={1}
                xAnchor={0.5}
              >
                <div
                  onClick={() => {
                    // 클러스터링된 마커 클릭 시 해당 위치로 줌인
                    if (mapInstance) {
                      const moveLatLon = new window.kakao.maps.LatLng(person.coordinates.lat, person.coordinates.lng);
                      mapInstance.setCenter(moveLatLon);
                      mapInstance.setLevel(ZOOM_LEVELS.DETAIL_VIEW);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <MissingPersonMarker
                    person={person}
                    onClick={() => {}}
                    isSelected={false}
                  />
                </div>
              </CustomOverlayMap>
            ))}
          </MarkerClusterer>
        ) : (
          // 개별 마커 모드: 커스텀 마커 사용
          mockMissingPersons.map((person) => (
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
          ))
        )}
      </Map>


      {/* 클러스터링 라이브러리 로드 상태 표시 */}
      {!isClusterLoaded && isKakaoLoaded && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              클러스터링 라이브러리 로딩 중...
            </div>
          </div>
        </div>
      )}

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