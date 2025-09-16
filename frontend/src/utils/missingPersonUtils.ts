/**
 * 실종 현황 더미 데이터 타입
 */
export interface MissingStatusData {
  receivedCount: number;    // 실종 접수
  resolvedCount: number;    // 실종 해제
  reportCount: number;      // 실종자 신고
}

/**
 * 실종 현황 더미 데이터 생성
 * TODO: 실제 백엔드 API로 교체 예정
 */
export const getMissingStatusData = (): MissingStatusData => {
  // 더미 데이터 - 실제로는 백엔드에서 가져올 예정
  return {
    receivedCount: Math.floor(Math.random() * 10) + 1,  // 1-10 사이 랜덤
    resolvedCount: Math.floor(Math.random() * 5) + 1,   // 1-5 사이 랜덤
    reportCount: Math.floor(Math.random() * 15) + 1     // 1-15 사이 랜덤
  };
};
