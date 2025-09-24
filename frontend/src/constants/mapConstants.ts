// 지도 관련 상수

// 줌 레벨 상수
export const ZOOM_LEVELS = {
  CLUSTER_THRESHOLD: 6, // 이 레벨 이상에서는 클러스터링 사용 (멀어졌을 때)
  DETAIL_VIEW: 4, // 개별 마커 표시 레벨
  STREET_VIEW: 3, // 거리 단위 뷰
  DISTRICT_VIEW: 2, // 구/군 단위 뷰
  CITY_VIEW: 1, // 시 단위 뷰
} as const;

// 클러스터링 설정
export const CLUSTER_OPTIONS = {
  minClusterSize: 2, // 최소 클러스터 크기
  averageCenter: true, // 클러스터 중심을 평균으로 설정
  minLevel: 1, // 클러스터링을 시작할 최소 줌 레벨
  gridSize: 60, // 클러스터 그리드 크기
  disableClickZoom: false, // 클러스터 클릭 시 줌인 비활성화 여부
} as const;

// 클러스터 마커 스타일 설정
export const CLUSTER_STYLES = [
  // 소규모 클러스터 (2-10개)
  {
    width: '40px',
    height: '40px',
    background: 'rgba(59, 130, 246,1)', // 파란색
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    lineHeight: '40px',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  // 중규모 클러스터 (11-50개)
  {
    width: '50px',
    height: '50px',
    background: 'rgba(34, 197, 94, 1)', // 초록색
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    lineHeight: '50px',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  // 대규모 클러스터 (51개 이상)
  {
    width: '60px',
    height: '60px',
    background: 'rgba(239, 68, 68, 1)', // 빨간색
    borderRadius: '50%',
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    lineHeight: '60px',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  }
];
