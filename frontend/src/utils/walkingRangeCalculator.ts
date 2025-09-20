// 도보 범위 계산 유틸리티

export interface WalkingRange {
  radius: number; // 반경 (미터)
  area: number; // 면적 (제곱미터)
}

export interface WalkingRangeOptions {
  hours: number; // 경과 시간 (시간)
  walkingSpeed: number; // 도보 속도 (km/h, 기본값: 4km/h)
}

/**
 * 경과 시간에 따른 도보 이동 가능 범위 계산
 */
export const calculateWalkingRange = (options: WalkingRangeOptions): WalkingRange => {
  const { hours, walkingSpeed = 4 } = options;
  
  // 이동 가능한 거리 (km)
  const maxDistance = hours * walkingSpeed;
  
  // 반경 (미터)
  const radius = maxDistance * 1000;
  
  // 면적 (제곱미터)
  const area = Math.PI * radius * radius;
  
  return {
    radius,
    area
  };
};

/**
 * 실종자 정보로부터 도보 범위 계산
 */
export const calculateMissingPersonWalkingRange = (lastSeenDate: string): WalkingRange => {
  const now = new Date();
  const missingDate = new Date(lastSeenDate);
  const hoursElapsed = (now.getTime() - missingDate.getTime()) / (1000 * 60 * 60);
  
  // 더 현실적인 범위로 제한 (최대 24시간, 최소 1시간)
  const realisticHours = Math.min(24, Math.max(1, hoursElapsed));
  
  return calculateWalkingRange({
    hours: realisticHours,
    walkingSpeed: 3 // 더 보수적인 도보 속도 3km/h
  });
};

/**
 * 도보 범위를 사람이 읽기 쉬운 형태로 포맷
 */
export const formatWalkingRange = (range: WalkingRange) => {
  const radiusKm = (range.radius / 1000).toFixed(1);
  const areaKm2 = (range.area / 1000000).toFixed(1);
  
  return {
    radiusText: `${radiusKm}km`,
    areaText: `${areaKm2}km²`
  };
};
