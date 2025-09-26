import type { MissingPersonListItem } from '../types/missingPerson';

/**
 * 실종 현황 데이터 타입
 */
export interface MissingStatusData {
  receivedCount: number;    // 실종 접수
  resolvedCount: number;    // 실종 해제
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
    const createdTime = new Date(person.createdAt);
    const hoursElapsed = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);
    return hoursElapsed <= 24; // 24시간 이내만 표시
  });
};

/**
 * 오늘 발생한 실종자만 필터링하는 함수 (occurDate 기준)
 */
export const filterTodayMissingPersons = (persons: MissingPersonListItem[]) => {
  const today = new Date();
  const todayStr = today.getFullYear().toString() + 
    (today.getMonth() + 1).toString().padStart(2, '0') + 
    today.getDate().toString().padStart(2, '0');
  
  return persons.filter(person => {
    return person.occurDate === todayStr; // 오늘 발생한 사건만
  });
};

/**
 * 지도 표시용 필터: occurDate가 올해이고 createdAt이 24시간 이내인 경우만 유지
 */
export const filterPersonsForMap = (persons: MissingPersonListItem[]) => {
  const now = new Date();
  const currentYear = now.getFullYear();

  return persons.filter(person => {
    // occurDate가 올해인지 확인
    const occur = parseOccurDate(person.occurDate);
    const isCurrentYear = occur.getFullYear() === currentYear;

    // createdAt이 24시간 이내인지 확인
    const createdTime = new Date(person.createdAt);
    const hoursSinceCreated = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);
    const isWithin24hOfCreated = hoursSinceCreated <= 24;

    return isCurrentYear && isWithin24hOfCreated;
  });
};

/**
 * 실종 현황 데이터 생성
 */
export const getMissingStatusData = (persons: MissingPersonListItem[]): MissingStatusData => {
  // 오늘 발생한 실종자 수 (occurDate 기준)
  const todayPersons = filterTodayMissingPersons(persons);
  
  return {
    receivedCount: todayPersons.length,  // 오늘 발생한 실종자 수 (실종 접수)
    resolvedCount: persons.length   // 전체 cases 개수 (누적 접수)
  };
};
