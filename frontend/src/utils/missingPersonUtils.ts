import type { MissingPersonListItem } from '../types/missingPerson';

/**
 * 실종 현황 데이터 타입
 */
export interface MissingStatusData {
  receivedCount: number;    // 실종 접수
  resolvedCount: number;    // 실종 해제
  reportCount: number;      // 실종자 신고
}

/**
 * YYYYMMDD 형식의 날짜를 Date 객체로 변환
 */
export const parseOccurDate = (occurDate: string): Date => {
  const year = parseInt(occurDate.substring(0, 4));
  const month = parseInt(occurDate.substring(4, 6)) - 1; // 월은 0부터 시작
  const day = parseInt(occurDate.substring(6, 8));
  return new Date(year, month, day);
};

/**
 * 24시간 이내 실종자만 필터링하는 함수
 */
export const filterRecentMissingPersons = (persons: MissingPersonListItem[]) => {
  const now = new Date();
  return persons.filter(person => {
    const missingDate = parseOccurDate(person.occurDate);
    const hoursElapsed = (now.getTime() - missingDate.getTime()) / (1000 * 60 * 60);
    return hoursElapsed <= 24; // 24시간 이내만 표시
  });
};

/**
 * 실종 현황 데이터 생성
 */
export const getMissingStatusData = (persons: MissingPersonListItem[]): MissingStatusData => {
  const openPersons = persons.filter(person => person.status === 'OPEN');
  const closedPersons = persons.filter(person => person.status === 'CLOSED');
  
  // 24시간 이내 실종자 수를 신고 수로 사용 (실제 데이터 기반)
  const recentPersons = filterRecentMissingPersons(persons);
  
  return {
    receivedCount: openPersons.length,  // 현재 열린 케이스 수
    resolvedCount: closedPersons.length,   // 해제된 케이스 수
    reportCount: recentPersons.length     // 24시간 이내 실종자 수 (신고 수로 사용)
  };
};
