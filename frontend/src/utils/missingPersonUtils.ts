import { mockMissingPersons } from '../data/mockMissingPersons';

/**
 * 실종 현황 더미 데이터 타입
 */
export interface MissingStatusData {
  receivedCount: number;    // 실종 접수
  resolvedCount: number;    // 실종 해제
  reportCount: number;      // 실종자 신고
}

/**
 * 24시간 이내 실종자만 필터링하는 함수
 */
const filterRecentMissingPersons = (persons: any[]) => {
  const now = new Date();
  return persons.filter(person => {
    const missingDate = new Date(person.lastSeenDate);
    const hoursElapsed = (now.getTime() - missingDate.getTime()) / (1000 * 60 * 60);
    return hoursElapsed <= 24; // 24시간 이내만 표시
  });
};

/**
 * 실종 현황 더미 데이터 생성 (24시간 기준)
 * TODO: 실제 백엔드 API로 교체 예정
 */
export const getMissingStatusData = (): MissingStatusData => {
  // mockMissingPersons에서 24시간 이내 실종자만 카운트
  const recentPersons = filterRecentMissingPersons(mockMissingPersons);
  
  return {
    receivedCount: recentPersons.length,  // 24시간 이내 실종자 수
    resolvedCount: Math.floor(Math.random() * 3) + 1,   // 1-3 사이 랜덤 (해제된 수)
    reportCount: Math.floor(Math.random() * 8) + 1     // 1-8 사이 랜덤 (신고 수)
  };
};
