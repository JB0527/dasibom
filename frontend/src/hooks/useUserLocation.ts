import { useState, useEffect } from 'react';

interface UserLocation {
  lat: number;
  lon: number;
  accuracy?: number;
}

interface UseUserLocationReturn {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export const useUserLocation = (): UseUserLocationReturn => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({
          lat: latitude,
          lon: longitude,
          accuracy: accuracy
        });
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = '위치를 가져올 수 없습니다.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다.';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        console.error('위치 에러:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    );
  };

  // 컴포넌트 마운트 시 자동으로 위치 요청
  useEffect(() => {
    requestLocation();
  }, []);

  return {
    userLocation,
    isLoading,
    error,
    requestLocation
  };
};
