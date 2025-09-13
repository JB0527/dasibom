import { useState, useEffect } from 'react';

export const useKakaoMap = () => {
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

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
    mapInstance,
    setMapInstance
  };
};
