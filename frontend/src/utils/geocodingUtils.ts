// 카카오맵 Geocoding 유틸리티
import type { MissingPersonListItem } from '../types/missingPerson';

export interface GeocodingResult {
  lat: number;
  lon: number;
  success: boolean;
  error?: string;
}

// 주소 캐싱을 위한 변수
const addressCache = new Map<string, { result: GeocodingResult; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시

// 주소를 좌표로 변환하는 함수
export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
  // 캐시 확인 (만료 시간 체크)
  const cached = addressCache.get(address);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  return new Promise((resolve) => {
    // 카카오맵이 로드되지 않았으면 실패 (더 엄격한 체크)
    if (!window.kakao || 
        !window.kakao.maps || 
        !window.kakao.maps.services || 
        !window.kakao.maps.LatLng ||
        typeof window.kakao.maps.LatLng !== 'function') {
      console.warn('카카오맵 SDK가 완전히 로드되지 않음, 기본 좌표 사용');
      const result = {
        lat: 37.5665,
        lon: 126.9780,
        success: false,
        error: '카카오맵 SDK가 완전히 로드되지 않았습니다.'
      };
      addressCache.set(address, { result, timestamp: Date.now() });
      resolve(result);
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    
    geocoder.addressSearch(address, (result: any, status: any) => {
      let geocodingResult: GeocodingResult;
      
      if (status === window.kakao.maps.services.Status.OK) {
        // 검색 결과가 있으면 첫 번째 결과 사용
        const coords = result[0];
        geocodingResult = {
          lat: parseFloat(coords.y),
          lon: parseFloat(coords.x),
          success: true
        };
      } else {
        // 검색 실패 시 null 반환 (마커 표시 안함)
        console.warn(`주소 검색 실패: ${address}`, status);
        geocodingResult = {
          lat: 0,
          lon: 0,
          success: false,
          error: `주소 검색 실패: ${status}`
        };
      }
      
      // 결과를 캐시에 저장
      addressCache.set(address, { result: geocodingResult, timestamp: Date.now() });
      resolve(geocodingResult);
    });
  });
};

// 여러 주소를 일괄 변환하는 함수 (배치 처리로 최적화)
export const geocodeAddresses = async (persons: MissingPersonListItem[]): Promise<Array<{ person: MissingPersonListItem; coords: GeocodingResult }>> => {
  // 카카오맵 SDK 로딩 대기 (최대 10초)
  const waitForKakaoMap = () => {
    return new Promise<void>((resolve) => {
      let retryCount = 0;
      const maxRetries = 100; // 10초 대기 (100ms * 100)
      
      const checkKakaoMap = () => {
        if (window.kakao && 
            window.kakao.maps && 
            window.kakao.maps.services && 
            window.kakao.maps.LatLng &&
            typeof window.kakao.maps.LatLng === 'function') {
          console.log('🗺️ 카카오맵 SDK 로딩 완료');
          resolve();
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkKakaoMap, 100);
        } else {
          console.warn('카카오맵 SDK 로딩 시간 초과, 기본 좌표 사용');
          resolve(); // 시간 초과해도 계속 진행
        }
      };
      checkKakaoMap();
    });
  };

  await waitForKakaoMap();

  // 중복 주소 제거 및 배치 처리
  const uniqueAddresses = [...new Set(persons.map(p => p.occurAddress || '').filter(addr => addr))];

  // 고유 주소들만 먼저 처리
  const addressResults = await Promise.allSettled(
    uniqueAddresses.map(async (address) => {
      const coords = await geocodeAddress(address);
      return { address, coords };
    })
  );

  // 주소별 결과를 Map으로 저장
  const addressMap = new Map<string, GeocodingResult>();
  addressResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      addressMap.set(result.value.address, result.value.coords);
    } else {
      // 실패한 경우 기본값 설정
      addressMap.set(uniqueAddresses[index], {
        lat: 0,
        lon: 0,
        success: false,
        error: 'Geocoding 실패'
      });
    }
  });

  // 각 실종자에 대해 결과 매핑
  const results = persons.map(person => {
    const coords = addressMap.get(person.occurAddress || '') || {
      lat: 0,
      lon: 0,
      success: false,
      error: '주소 없음'
    };
    return { person, coords };
  });

  return results;
};

// 주소 정리 함수 (검색 성공률 향상을 위해)
export const cleanAddress = (address: string): string => {
  if (!address) return '';
  
  // 불필요한 공백 제거
  let cleaned = address.trim();
  
  // "서울특별시" → "서울" 변환 (검색 성공률 향상)
  cleaned = cleaned.replace(/서울특별시/g, '서울');
  cleaned = cleaned.replace(/부산광역시/g, '부산');
  cleaned = cleaned.replace(/대구광역시/g, '대구');
  cleaned = cleaned.replace(/인천광역시/g, '인천');
  cleaned = cleaned.replace(/광주광역시/g, '광주');
  cleaned = cleaned.replace(/대전광역시/g, '대전');
  cleaned = cleaned.replace(/울산광역시/g, '울산');
  
  return cleaned;
};
