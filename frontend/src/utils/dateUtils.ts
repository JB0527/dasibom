/**
 * 오늘 날짜를 "YYYY년 MM월 DD일" 형식으로 반환
 */
export const getTodayFormatted = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // getMonth()는 0부터 시작
  const day = today.getDate();
  
  return `${year}년 ${month.toString().padStart(2, '0')}월 ${day.toString().padStart(2, '0')}일`;
};
