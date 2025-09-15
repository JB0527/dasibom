import { useEffect, useState } from 'react';
import { ZOOM_LEVELS } from '../constants/mapConstants';

interface ClusterManagerProps {
  currentZoomLevel: number;
}

export const useClusterManager = ({ currentZoomLevel }: ClusterManagerProps) => {
  const [isClustering, setIsClustering] = useState(false);

  // 클러스터링이 필요한지 확인 (줌 레벨이 높을 때 = 멀어졌을 때 클러스터링)
  const shouldUseClustering = currentZoomLevel >= ZOOM_LEVELS.CLUSTER_THRESHOLD;

  // 클러스터링 상태 업데이트
  useEffect(() => {
    setIsClustering(shouldUseClustering);
  }, [shouldUseClustering]);

  return {
    isClustering,
  };
};
