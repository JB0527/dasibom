import React, { useState, memo, useCallback, useEffect } from 'react';
import { Map, CustomOverlayMap, MarkerClusterer } from 'react-kakao-maps-sdk';
import { useMapMissingPerson } from '../../hooks/useOptimizedMissingPerson';
import { useKakaoMap } from '../../hooks/useKakaoMap';
import { useZoomLevel } from '../../hooks/useZoomLevel';
import { useClusterManager } from '../../hooks/useClusterManager';
import { useUserLocation } from '../../hooks/useUserLocation';
import MissingPersonMarker from '../../components/Map/MissingPersonMarker';
import UserLocationMarker from '../../components/Map/UserLocationMarker';
import type { MissingPersonMapItem } from '../../types/missingPerson';
import { calculateElapsedTimeFromCreated } from '../../utils/timeUtils';
import { ZOOM_LEVELS, CLUSTER_STYLES } from '../../constants/mapConstants';

const CCTVSearchPage: React.FC = memo(() => {
  const { missingPersons, isLoading, error } = useMapMissingPerson();
  const [selectedPerson, setSelectedPerson] = useState<MissingPersonMapItem | null>(null);
  const [showPhotos, setShowPhotos] = useState(false);
  const [selectedCCTVPhoto, setSelectedCCTVPhoto] = useState<any>(null);
  
  // 카카오맵 훅 사용
  const { isKakaoLoaded, isClusterLoaded, mapInstance, setMapInstance } = useKakaoMap();
  
  // 줌 레벨 추적
  const currentZoomLevel = useZoomLevel({ mapInstance });
  
  // 클러스터링 관리
  const { isClustering } = useClusterManager({
    currentZoomLevel,
  });
  
  // 사용자 위치 훅
  const { userLocation, isLoading: isLocationLoading, error: locationError, requestLocation } = useUserLocation();
  
  // 24시간 이내 실종자 필터링
  const recentMissingPersons = (missingPersons || []).filter(person => {
    if (!person.createdAt) return false;
    const elapsedTime = calculateElapsedTimeFromCreated(person.createdAt);
    return elapsedTime.hours <= 24;
  });

  // 사용자 위치가 변경되면 지도 중심을 이동 (한 번만 실행)
  useEffect(() => {
    if (userLocation && mapInstance && window.kakao && window.kakao.maps && window.kakao.maps.LatLng && typeof window.kakao.maps.LatLng === 'function') {
      try {
        const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lon);
        mapInstance.setCenter(moveLatLon);
        mapInstance.setLevel(ZOOM_LEVELS.STREET_VIEW); // 거리 단위 뷰로 설정
      } catch (error) {
        console.error('LatLng 생성 실패:', error);
      }
    }
  }, [userLocation?.lat, userLocation?.lon, mapInstance]); // 정확한 의존성만 사용

  // 마커 클릭 핸들러 - 자동으로 CCTV 표시
  const handleMarkerClick = useCallback((person: MissingPersonMapItem) => {
    setSelectedPerson(person);
    setShowPhotos(true);
  }, []);

  // CCTV 사진 목업 데이터 (assets 폴더의 이미지 사용)
  const cctvPhotos = selectedPerson ? [
    { 
      id: 1, 
      lat: selectedPerson.point.lat + 0.005, 
      lng: selectedPerson.point.lon + 0.005, 
      imageUrl: '/assets/cctv1.png',
      timestamp: '2024-01-15 14:30:25',
      location: '서울시 강남구 테헤란로 123',
      accuracy: 87
    },
    { 
      id: 2, 
      lat: selectedPerson.point.lat - 0.005, 
      lng: selectedPerson.point.lon + 0.005, 
      imageUrl: '/assets/cctv2.png',
      timestamp: '2024-01-15 14:32:10',
      location: '서울시 강남구 테헤란로 125',
      accuracy: 92
    },
    { 
      id: 3, 
      lat: selectedPerson.point.lat + 0.005, 
      lng: selectedPerson.point.lon - 0.005, 
      imageUrl: '/assets/cctv1.png',
      timestamp: '2024-01-15 14:35:45',
      location: '서울시 강남구 테헤란로 127',
      accuracy: 78
    },
    { 
      id: 4, 
      lat: selectedPerson.point.lat - 0.005, 
      lng: selectedPerson.point.lon - 0.005, 
      imageUrl: '/assets/cctv2.png',
      timestamp: '2024-01-15 14:38:20',
      location: '서울시 강남구 테헤란로 129',
      accuracy: 95
    },
  ] : [];

  // 로딩 상태
  if (!isKakaoLoaded || isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{isLoading ? 'CCTV 데이터를 불러오는 중...' : '지도를 불러오는 중...'}</p>
          <p className="text-sm text-gray-400 mt-2">
            {isLoading ? '주소를 좌표로 변환하고 있습니다' : '잠시만 기다려주세요'}
          </p>
        </div>
      </div>
    );
  }

  // 에러 상태 - 지도는 표시하되 에러 메시지만 표시
  const showErrorAlert = error && (
    <div className="absolute top-4 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-center">
        <div className="text-red-500 text-xl mr-3">⚠️</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">데이터 로드 실패</h3>
          <p className="text-xs text-red-600 mt-1">{error?.message || String(error)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {/* 에러 알림 */}
      {showErrorAlert}
      
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
            position={{ lat: userLocation.lat, lng: userLocation.lon }}
            yAnchor={0.5}
            xAnchor={0.5}
          >
            <UserLocationMarker
              lat={userLocation.lat}
              lon={userLocation.lon}
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
            {recentMissingPersons.filter(person => person.point).map((person) => (
              <CustomOverlayMap
                key={`cluster-${person.id}`}
                position={{ lat: person.point!.lat, lng: person.point!.lon }}
                yAnchor={1}
                xAnchor={0.5}
              >
                <div
                  onClick={() => {
                    // 클러스터링된 마커 클릭 시 해당 위치로 줌인
                    if (mapInstance && window.kakao && window.kakao.maps && window.kakao.maps.LatLng) {
                      const moveLatLon = new window.kakao.maps.LatLng(person.point!.lat, person.point!.lon);
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
          recentMissingPersons.filter(person => person.point).map((person) => (
            <CustomOverlayMap
              key={`marker-${person.id}`}
              position={{ lat: person.point!.lat, lng: person.point!.lon }}
              yAnchor={1}
              xAnchor={0.5}
            >
              <MissingPersonMarker
                person={person}
                onClick={() => handleMarkerClick(person)}
                isSelected={false}
              />
            </CustomOverlayMap>
          ))
        )}

        {/* 선택된 실종자 주변 CCTV 예상 위치 마커들 (CCTV 아이콘) */}
        {showPhotos && cctvPhotos.map((photo) => (
          <CustomOverlayMap
            key={photo.id}
            position={{ lat: photo.lat, lng: photo.lng }}
            yAnchor={0.5}
            xAnchor={0.5}
          >
            <div 
              className="w-16 h-16 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setSelectedCCTVPhoto(photo)}
              title={`CCTV #${photo.id} - ${photo.timestamp}`}
            >
              {/* 천장 연결부 */}
              <div className="w-1 h-4 bg-gray-600"></div>
              
              {/* CCTV 카메라 본체 (천장형 돔 카메라) */}
              <div className="w-12 h-8 bg-gray-800 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative">
                {/* 카메라 렌즈 (돔 안쪽) */}
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
                {/* 적외선 LED 표시 */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute top-1 left-1 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CustomOverlayMap>
        ))}
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
      <div className="absolute bottom-4 right-4 z-50 space-y-2">
        {/* 위치 버튼 */}
        <button
          onClick={requestLocation}
          disabled={isLocationLoading}
          className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 p-4 md:p-3 rounded-full shadow-lg border border-gray-200 transition-colors"
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



      {/* CCTV 사진 확대 모달 */}
      {selectedCCTVPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedCCTVPhoto(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">CCTV #{selectedCCTVPhoto.id}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedCCTVPhoto.accuracy >= 90 ? 'bg-green-100 text-green-800' :
                    selectedCCTVPhoto.accuracy >= 80 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    정확도 {selectedCCTVPhoto.accuracy}%
                  </div>
                </div>
                <p className="text-sm text-gray-600">{selectedCCTVPhoto.timestamp}</p>
                <p className="text-xs text-gray-500">{selectedCCTVPhoto.location}</p>
              </div>
              <button
                onClick={() => setSelectedCCTVPhoto(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* CCTV 사진 */}
            <div className="p-4">
              <img
                src={selectedCCTVPhoto.imageUrl}
                alt={`CCTV ${selectedCCTVPhoto.id}`}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            
            {/* 모달 푸터 */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">촬영 시간:</span> {selectedCCTVPhoto.timestamp}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">위치:</span> {selectedCCTVPhoto.location}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">정확도:</span> 
                    <span className={`ml-1 font-semibold ${
                      selectedCCTVPhoto.accuracy >= 90 ? 'text-green-600' :
                      selectedCCTVPhoto.accuracy >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedCCTVPhoto.accuracy}%
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedCCTVPhoto(null)}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CCTVSearchPage.displayName = 'CCTVSearchPage';

export default CCTVSearchPage;
