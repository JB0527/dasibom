import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 클라이언트 상태만 관리 (서버 상태는 React Query에서 관리)
interface MissingPersonState {
  // UI 상태
  selectedPersonId: string | null;
  mapCenter: { lat: number; lng: number };
  currentZoomLevel: number;
  
  // 액션
  setSelectedPerson: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setZoomLevel: (level: number) => void;
  reset: () => void;
}

export const useMissingPersonStore = create<MissingPersonState>()(
  devtools(
    persist(
      (set) => ({
        // 초기 상태
        selectedPersonId: null,
        mapCenter: { lat: 37.5665, lng: 126.9780 }, // 서울 중심
        currentZoomLevel: 3,

        // 액션들
        setSelectedPerson: (id: string | null) => {
          set({ selectedPersonId: id });
        },

        setMapCenter: (center: { lat: number; lng: number }) => {
          set({ mapCenter: center });
        },

        setZoomLevel: (level: number) => {
          set({ currentZoomLevel: level });
        },

        reset: () => {
          set({
            selectedPersonId: null,
            mapCenter: { lat: 37.5665, lng: 126.9780 },
            currentZoomLevel: 3,
          });
        },
      }),
      {
        name: 'missing-person-store',
        partialize: (state) => ({
          mapCenter: state.mapCenter,
          currentZoomLevel: state.currentZoomLevel,
        }),
      }
    ),
    {
      name: 'missing-person-store',
    }
  )
);

// 선택자 훅들 (성능 최적화)
export const useSelectedPersonId = () => useMissingPersonStore(state => state.selectedPersonId);
export const useMapCenter = () => useMissingPersonStore(state => state.mapCenter);
export const useCurrentZoomLevel = () => useMissingPersonStore(state => state.currentZoomLevel);
