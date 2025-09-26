import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { missingPersonApi } from '../api/missingPerson';
import { geocodeAddresses, cleanAddress } from '../utils/geocodingUtils';
import type { MissingPersonListItem, MissingPersonMapItem } from '../types/missingPerson';
import { filterPersonsForMap } from '../utils/missingPersonUtils';

interface MissingPersonState {
  // 데이터
  allPersons: MissingPersonListItem[];
  mapPersons: MissingPersonMapItem[];
  
  // 상태
  isLoading: boolean;
  isGeocoding: boolean;
  error: string | null;
  lastFetchTime: number | null;
  
  // 필터링된 데이터 (computed)
  recentPersons: MissingPersonListItem[];
  oldPersons: MissingPersonListItem[];
  
  // 액션
  fetchAllPersons: () => Promise<void>;
  fetchMapPersons: () => Promise<void>;
  updateMapPersons: (persons: MissingPersonMapItem[]) => void;
  clearError: () => void;
  reset: () => void;
}

// 필터링 로직
const filterPersons = (persons: MissingPersonListItem[]) => {
  const now = new Date().getTime();
  
  const recent: MissingPersonListItem[] = [];
  const old: MissingPersonListItem[] = [];
  
  persons.forEach(person => {
    const occurDate = new Date(
      person.occurDate.substring(0, 4) + '-' +
      person.occurDate.substring(4, 6) + '-' +
      person.occurDate.substring(6, 8)
    );
    const hoursElapsed = (now - occurDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursElapsed <= 24) {
      recent.push(person);
    } else {
      old.push(person);
    }
  });
  
  return { recent, old };
};

export const useMissingPersonStore = create<MissingPersonState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        allPersons: [],
        mapPersons: [],
        isLoading: false,
        isGeocoding: false,
        error: null,
        lastFetchTime: null,
        recentPersons: [],
        oldPersons: [],

        // 전체 실종자 데이터 가져오기 (캐싱 포함)
        fetchAllPersons: async () => {
          const state = get();
          const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시
          
          // 캐시 확인
          if (state.lastFetchTime && (Date.now() - state.lastFetchTime) < CACHE_DURATION) {
            return;
          }

          set({ isLoading: true, error: null });
          
          try {
            const result = await missingPersonApi.getCasesList();
            const { recent, old } = filterPersons(result);
            
            set({
              allPersons: result,
              recentPersons: recent,
              oldPersons: old,
              isLoading: false,
              error: null,
              lastFetchTime: Date.now(),
            });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '실종자 데이터 로드 실패';
            set({ isLoading: false, error: errorMessage });
          }
        },

        // 지도용 실종자 데이터 가져오기 (Geocoding 포함)
        fetchMapPersons: async () => {
          const state = get();
          
          // 먼저 전체 데이터가 있는지 확인
          if (state.allPersons.length === 0) {
            await get().fetchAllPersons();
          }
          
          // 최신 상태에서 allPersons를 가져와 지도 표시 기준으로 필터링
          const currentState = get();
          const { allPersons } = currentState;
          const recentPersons = filterPersonsForMap(allPersons);
          
          if (recentPersons.length === 0) {
            set({ mapPersons: [] });
            return;
          }

          set({ isGeocoding: true, error: null });
          
          try {
            // 주소 정리
            const personsWithCleanedAddress = recentPersons.map(person => ({
              ...person,
              occurAddress: cleanAddress(person.occurAddress || '')
            }));
            
            // Geocoding 수행
            const geocodingResults = await geocodeAddresses(personsWithCleanedAddress);
            
            // 성공한 좌표만 지도용 데이터로 변환
            const mapItems: MissingPersonMapItem[] = geocodingResults
              .filter(({ coords }) => coords.success && coords.lat !== 0 && coords.lon !== 0)
              .map(({ person, coords }) => ({
                ...person,
                point: { lat: coords.lat, lon: coords.lon },
                prediction: undefined
              }));
            
            // 성공/실패 통계
            // const successCount = geocodingResults.filter(({ coords }) => coords.success).length;
            // const failCount = geocodingResults.length - successCount;
            
            set({ 
              mapPersons: mapItems,
              isGeocoding: false,
              error: null 
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Geocoding 실패';
            set({ isGeocoding: false, error: errorMessage });
          }
        },

        // 지도용 데이터 수동 업데이트
        updateMapPersons: (persons: MissingPersonMapItem[]) => {
          set({ mapPersons: persons });
        },

        // 에러 클리어
        clearError: () => {
          set({ error: null });
        },

        // 상태 리셋
        reset: () => {
          set({
            allPersons: [],
            mapPersons: [],
            isLoading: false,
            isGeocoding: false,
            error: null,
            lastFetchTime: null,
            recentPersons: [],
            oldPersons: [],
          });
        },
      }),
      {
        name: 'missing-person-store',
        partialize: (state) => ({
          allPersons: state.allPersons,
          lastFetchTime: state.lastFetchTime,
        }),
      }
    ),
    {
      name: 'missing-person-store',
    }
  )
);

// 선택자 훅들 (성능 최적화)
export const useAllPersons = () => useMissingPersonStore(state => state.allPersons);
export const useMapPersons = () => useMissingPersonStore(state => state.mapPersons);
export const useRecentPersons = () => useMissingPersonStore(state => state.recentPersons);
export const useOldPersons = () => useMissingPersonStore(state => state.oldPersons);
export const useIsLoading = () => useMissingPersonStore(state => state.isLoading);
export const useIsGeocoding = () => useMissingPersonStore(state => state.isGeocoding);
export const useError = () => useMissingPersonStore(state => state.error);
