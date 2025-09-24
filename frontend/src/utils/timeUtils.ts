// 실시간 경과시간 계산 유틸리티

export interface TimeElapsed {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
}

/**
 * 실종 시간으로부터 경과된 시간을 계산
 * @param lastSeenDate 실종일시 (ISO 8601 형식: YYYY-MM-DDTHH:mm:ss)
 * @returns 경과된 시간 정보
 */
export const calculateElapsedTime = (lastSeenDate: string): TimeElapsed => {
  const lastSeen = new Date(lastSeenDate);
  const now = new Date();
  
  const diffMs = now.getTime() - lastSeen.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  };
};

/**
 * 나이에 따른 평균 도보 예측 거리 계산 (미터 단위)
 * @param age 나이
 * @returns 평균 도보 예측 거리 (미터)
 */
export const getWalkingDistanceByAge = (age: number): number => {
  // 나이별 평균 도보 예측 거리 (1시간 기준)
  if (age < 10) return 2000;      // 어린이: 2km
  if (age < 20) return 4000;      // 청소년: 4km
  if (age < 30) return 5000;      // 20대: 5km (가장 활발)
  if (age < 40) return 4500;      // 30대: 4.5km
  if (age < 50) return 3500;      // 40대: 3.5km
  if (age < 60) return 3000;      // 50대: 3km
  if (age < 70) return 2500;      // 60대: 2.5km
  return 2000;                    // 70대 이상: 2km
};

/**
 * 도보 거리를 지도상 원형 크기로 변환 (실제 거리 비율 반영)
 * @param distanceInMeters 도보 거리 (미터)
 * @param mapLevel 현재 지도 줌 레벨
 * @returns 원형 영역의 크기 (px)
 */
export const getCircleSizeByDistance = (distanceInMeters: number, mapLevel: number = 3): number => {
  // 지도 레벨에 따른 스케일 조정 (더 정확한 비율)
  const scaleFactor = Math.pow(2, 3 - mapLevel);
  
  // 거리를 픽셀로 변환 (더 정확한 계산)
  // 1km = 약 150px (레벨 3 기준) - 더 크게 조정
  const baseSize = (distanceInMeters / 1000) * 150 * scaleFactor;
  
  // 최소/최대 크기 제한을 더 넓게 조정
  return Math.max(80, Math.min(400, baseSize));
};

/**
 * 나이에 따른 원형 영역 크기 계산 (도보 예측 거리 기반)
 * @param age 나이
 * @param mapLevel 현재 지도 줌 레벨
 * @returns 원형 영역의 크기 (px)
 */
export const getCircleSizeByAge = (age: number, mapLevel: number = 3): number => {
  const walkingDistance = getWalkingDistanceByAge(age);
  return getCircleSizeByDistance(walkingDistance, mapLevel);
};

/**
 * 나이와 실종 경과 시간을 고려한 동적 도보 예측 거리 계산 (하이브리드 방식)
 * @param age 나이
 * @param lastSeenDate 실종일시
 * @returns 동적 도보 예측 거리 (미터)
 */
export const getDynamicWalkingDistance = (age: number, lastSeenDate: string): number => {
  // 기본 나이별 도보 속도 (km/h)
  let baseSpeed: number;
  if (age < 10) baseSpeed = 2;      // 어린이: 2km/h
  else if (age < 20) baseSpeed = 4; // 청소년: 4km/h
  else if (age < 30) baseSpeed = 5; // 20대: 5km/h (가장 활발)
  else if (age < 40) baseSpeed = 4.5; // 30대: 4.5km/h
  else if (age < 50) baseSpeed = 3.5; // 40대: 3.5km/h
  else if (age < 60) baseSpeed = 3;   // 50대: 3km/h
  else if (age < 70) baseSpeed = 2.5; // 60대: 2.5km/h
  else baseSpeed = 2;                 // 70대 이상: 2km/h

  // 실종 경과 시간 계산 (시간 단위)
  const now = new Date();
  const missingDate = new Date(lastSeenDate);
  const hoursElapsed = (now.getTime() - missingDate.getTime()) / (1000 * 60 * 60);
  
  // 최소 1시간, 최대 72시간(3일)으로 제한
  const realisticHours = Math.min(72, Math.max(1, hoursElapsed));
  
  // 하이브리드 방식: 초기 선형, 후기 비선형
  let walkingDistance: number;
  
  if (realisticHours <= 6) {
    // 초기 6시간: 선형 증가 (신선한 상태, 빠른 이동)
    walkingDistance = baseSpeed * realisticHours;
  } else {
    // 6시간 이후: 비선형 증가 (피로도 고려, 최저 속도 보장)
    const linearDistance = baseSpeed * 6; // 6시간까지의 선형 거리
    const remainingHours = realisticHours - 6;
    
    // 최저 속도 보장 (기본 속도의 30%)
    const minSpeed = baseSpeed * 0.3;
    const currentSpeed = Math.max(minSpeed, baseSpeed * (1 / Math.sqrt(remainingHours + 1)));
    
    const additionalDistance = currentSpeed * remainingHours;
    walkingDistance = linearDistance + additionalDistance;
  }
  
  // 미터 단위로 변환
  return Math.round(walkingDistance * 1000);
};

/**
 * 나이에 따른 선택된 원형 영역 크기 계산
 * @param age 나이
 * @param mapLevel 현재 지도 줌 레벨
 * @returns 선택된 원형 영역의 크기 (px)
 */
export const getSelectedCircleSizeByAge = (age: number, mapLevel: number = 3): number => {
  const baseSize = getCircleSizeByAge(age, mapLevel);
  return baseSize + 20; // 선택 시 20px 더 크게
};
