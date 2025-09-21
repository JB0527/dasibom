// 실종자 관련 타입 정의
export interface MissingPerson {
  id: string;
  name: string;
  age: number;
  nationality: string;
  height: number;
  weight: number;
  build: string;
  faceShape: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  photo: string;
  coordinates: { lat: number; lng: number };
}
