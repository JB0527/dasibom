import { useState, useEffect } from 'react';

interface UseZoomLevelProps {
  mapInstance: any;
}

export const useZoomLevel = ({ mapInstance }: UseZoomLevelProps) => {
  const [zoomLevel, setZoomLevel] = useState<number>(3); // 기본 줌 레벨

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps) return;

    // 초기 줌 레벨 설정
    setZoomLevel(mapInstance.getLevel());

    // 줌 레벨 변경 이벤트 리스너
    const handleZoomChanged = () => {
      const newZoomLevel = mapInstance.getLevel();
      setZoomLevel(newZoomLevel);
    };

    window.kakao.maps.event.addListener(mapInstance, 'zoom_changed', handleZoomChanged);

    return () => {
      window.kakao.maps.event.removeListener(mapInstance, 'zoom_changed', handleZoomChanged);
    };
  }, [mapInstance]);

  return zoomLevel;
};
