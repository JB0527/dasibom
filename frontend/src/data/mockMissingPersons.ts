import type { MissingPerson } from '../types/missingPerson';

// 임시 데이터 (나중에 API에서 가져올 예정)
export const mockMissingPersons: MissingPerson[] = [
  {
    id: '1',
    name: '왕성민',
    age: 26,
    nationality: '내국인',
    height: 170,
    weight: 60,
    build: '보통 이상',
    faceShape: '갸름한형',
    lastSeenDate: '2025-09-19T21:00:00', // 21:00 실종 (1시간 28분 전)
    lastSeenLocation: '서울 강남구 테헤란로 123',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5663, lng: 126.9779 }
  },
  {
    id: '2',
    name: '김민수',
    age: 34,
    nationality: '내국인',
    height: 175,
    weight: 70,
    build: '보통',
    faceShape: '둥근형',
    lastSeenDate: '2025-09-19T18:00:00', // 18:00 실종 (4시간 28분 전)
    lastSeenLocation: '서울 종로구 인사동길 12',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5735, lng: 126.9788 }
  },
  {
    id: '3',
    name: '이지은',
    age: 28,
    nationality: '내국인',
    height: 165,
    weight: 55,
    build: '마른 편',
    faceShape: '계란형',
    lastSeenDate: '2025-09-19T15:00:00', // 15:00 실종 (7시간 28분 전)
    lastSeenLocation: '서울 마포구 홍대입구역 2번 출구',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5563, lng: 126.9226 }
  },
  {
    id: '4',
    name: '박철수',
    age: 31,
    nationality: '내국인',
    height: 180,
    weight: 75,
    build: '건장한 편',
    faceShape: '사각형',
    lastSeenDate: '2025-09-19T10:00:00', // 10:00 실종 (12시간 28분 전)
    lastSeenLocation: '서울 중구 을지로 285',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5667, lng: 126.9782 }
  },
  {
    id: '5',
    name: '최영희',
    age: 29,
    nationality: '내국인',
    height: 160,
    weight: 50,
    build: '마른 편',
    faceShape: '계란형',
    lastSeenDate: '2025-09-19T08:00:00', // 08:00 실종 (14시간 28분 전)
    lastSeenLocation: '서울 중구 을지로 290',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5669, lng: 126.9784 }
  },
  {
    id: '6',
    name: '정민호',
    age: 35,
    nationality: '내국인',
    height: 175,
    weight: 80,
    build: '보통',
    faceShape: '둥근형',
    lastSeenDate: '2025-09-19T06:00:00', // 06:00 실종 (16시간 28분 전)
    lastSeenLocation: '서울 종로구 종로 130',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5737, lng: 126.9790 }
  },
  {
    id: '7',
    name: '한소영',
    age: 27,
    nationality: '내국인',
    height: 168,
    weight: 58,
    build: '보통',
    faceShape: '갸름한형',
    lastSeenDate: '2025-09-20T02:00:00', // 02:00 실종 (20시간 28분 전)
    lastSeenLocation: '서울 종로구 종로 135',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5739, lng: 126.9792 }
  },
  {
    id: '8',
    name: '송태현',
    age: 33,
    nationality: '내국인',
    height: 182,
    weight: 85,
    build: '건장한 편',
    faceShape: '사각형',
    lastSeenDate: '2025-09-20T00:00:00', // 00:00 실종 (22시간 28분 전)
    lastSeenLocation: '서울 강남구 테헤란로 460',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    coordinates: { lat: 37.5665, lng: 126.9785 }
  }
];
