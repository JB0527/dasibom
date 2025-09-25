import { useState, useEffect } from 'react';

export const useKakaoMap = () => {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const [isClusterLoaded, setIsClusterLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);


  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    
    // 이미 로드되어 있다면 즉시 설정 (더 엄격한 체크)
    if (window.kakao && 
        window.kakao.maps && 
        window.kakao.maps.LatLng && 
        typeof window.kakao.maps.LatLng === 'function' &&
        window.kakao.maps.Map &&
        typeof window.kakao.maps.Map === 'function') {
      setIsKakaoLoaded(true);
      // 클러스터링 라이브러리도 확인
      if (window.kakao.maps.MarkerClusterer) {
        setIsClusterLoaded(true);
      }
      return;
    }

    // 중복 로드 방지
    if (document.querySelector(`script[src*="dapi.kakao.com"]`)) {
      // 기존 스크립트가 있다면 kakao.maps.load() 사용
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(() => {
          // 더 긴 대기 시간으로 모든 필요한 객체 확인
          setTimeout(() => {
            if (window.kakao && 
                window.kakao.maps && 
                window.kakao.maps.LatLng && 
                typeof window.kakao.maps.LatLng === 'function' &&
                window.kakao.maps.Map &&
                typeof window.kakao.maps.Map === 'function') {
              setIsKakaoLoaded(true);
              // 클러스터링 라이브러리도 확인
              if (window.kakao.maps.MarkerClusterer) {
                setIsClusterLoaded(true);
              }
            } else {
              console.error('kakao.maps 객체들이 완전히 로드되지 않음');
              setIsKakaoLoaded(true); // 일단 지도는 표시
            }
          }, 100);
        });
      } else {
        setIsKakaoLoaded(true);
      }
      return;
    }

    
    // 카카오맵 스크립트 동적 로드 (클러스터링 라이브러리 포함)
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      // 공식 문서에 따른 올바른 방법: kakao.maps.load() 사용
      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(() => {
          // 더 긴 대기 시간으로 LatLng 확인
          setTimeout(() => {
            if (window.kakao && 
                window.kakao.maps && 
                window.kakao.maps.LatLng && 
                typeof window.kakao.maps.LatLng === 'function' &&
                window.kakao.maps.Map &&
                typeof window.kakao.maps.Map === 'function') {
              setIsKakaoLoaded(true);
              // 클러스터링 라이브러리도 확인
              if (window.kakao.maps.MarkerClusterer) {
                setIsClusterLoaded(true);
              }
            } else {
              console.warn('카카오맵 객체들이 완전히 로드되지 않음');
              setIsKakaoLoaded(true); // 실패해도 지도 표시 시도
            }
          }, 2000); // 2초 대기로 증가
        });
      } else {
        console.error('kakao.maps.load 함수를 찾을 수 없음');
        setIsKakaoLoaded(true);
      }
    };
    
    script.onerror = () => {
      console.error('카카오맵 스크립트 로드 실패');
      setIsKakaoLoaded(true); // 로드 실패해도 지도 표시 시도
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 컴포넌트 언마운트 시 스크립트 정리
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return {
    isKakaoLoaded,
    isClusterLoaded,
    mapInstance,
    setMapInstance
  };
};