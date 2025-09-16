// 실시간 경과시간 계산 유틸리티

export interface TimeElapsed {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
}

/**
 * 실종 시간으로부터 경과된 시간을 계산
 * @param lastSeenDate 실종일시 (YYYY년 MM월 DD일 형식)
 * @returns 경과된 시간 정보
 */
export const calculateElapsedTime = (lastSeenDate: string): TimeElapsed => {
  // "2025년 08월30일" 형식을 Date 객체로 변환
  const dateStr = lastSeenDate.replace(/년|월|일/g, '-').replace(/-$/, '');
  const lastSeen = new Date(dateStr);
  const now = new Date();
  
  const diffMs = now.getTime() - lastSeen.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return {
    minutes,
    seconds,
    totalSeconds,
    formatted: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
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
 * 도보 거리를 지도상 원형 크기로 변환
 * @param distanceInMeters 도보 거리 (미터)
 * @param mapLevel 현재 지도 줌 레벨
 * @returns 원형 영역의 크기 (px)
 */
export const getCircleSizeByDistance = (distanceInMeters: number, mapLevel: number = 3): number => {
  // 지도 레벨에 따른 스케일 조정
  const scaleFactor = Math.pow(2, 3 - mapLevel); // 레벨 3 기준으로 스케일 조정
  
  // 거리를 픽셀로 변환 (대략적인 계산)
  // 1km = 약 100px (레벨 3 기준)
  const baseSize = (distanceInMeters / 1000) * 100 * scaleFactor;
  
  // 최소/최대 크기 제한
  return Math.max(60, Math.min(200, baseSize));
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
 * 나이에 따른 선택된 원형 영역 크기 계산
 * @param age 나이
 * @param mapLevel 현재 지도 줌 레벨
 * @returns 선택된 원형 영역의 크기 (px)
 */
export const getSelectedCircleSizeByAge = (age: number, mapLevel: number = 3): number => {
  const baseSize = getCircleSizeByAge(age, mapLevel);
  return baseSize + 20; // 선택 시 20px 더 크게
};
