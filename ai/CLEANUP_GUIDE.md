# 🧹 파일 정리 가이드

## 📁 현재 상태 분석

### ✅ 유지할 핵심 파일들 (FastAPI용)
```
ai/
├── bedrock_enhanced_case1.py      # ⭐ Case 1 메인
├── bedrock_enhanced_case2.py      # ⭐ Case 2 메인  
├── bedrock_case3.py               # ⭐ Case 3 메인
├── bedrock_super_resolution.py    # ⭐ Super Resolution
├── run_missing_person_ai.py       # ⭐ 통합 실행기
├── sample_person_info_enhanced.json # 예시 데이터
├── requirements_bedrock.txt        # 의존성
├── PROJECT_SUMMARY.md             # 프로젝트 정리
├── ENHANCED_QUICK_START.md        # 사용 가이드
└── HACKATHON_SETUP.md             # 해커톤 가이드
```

### ❌ 제거할 구버전 파일들
```
# 구버전 데모 파일들 (로컬 AI 모델 기반)
demo_case1.py
demo_case2.py
demo_case2_gpu_safe.py
demo_case2_sdxl_only.py
demo_case3.py
demo_case3_fixed.py
demo_super_resolution.py

# 구버전 Bedrock 파일들 (Enhanced 버전으로 대체됨)
bedrock_case1.py
bedrock_case2.py

# 기타
aws_config.py (통합됨)
```

## 🔄 FastAPI 전환 계획

### Phase 1: 백엔드 구조
```
backend/
├── main.py                    # FastAPI 메인 서버
├── api/
│   ├── __init__.py
│   ├── case1.py              # Case 1 API
│   ├── case2.py              # Case 2 API
│   ├── case3.py              # Case 3 API
│   └── super_resolution.py   # Super Resolution API
├── core/
│   ├── __init__.py
│   ├── ai_models.py          # AI 파이프라인 래퍼
│   ├── config.py             # 설정 관리
│   └── utils.py              # 유틸리티
├── models/
│   ├── __init__.py
│   ├── requests.py           # API 요청 모델
│   └── responses.py          # API 응답 모델
└── static/                   # 결과 파일 저장
```

### Phase 2: 프론트엔드 연결
```
frontend/
├── src/
│   ├── components/
│   │   ├── FileUpload.vue
│   │   ├── ProgressBar.vue
│   │   └── ResultViewer.vue
│   ├── services/
│   │   └── api.js
│   └── views/
│       ├── Case1.vue
│       ├── Case2.vue
│       └── Case3.vue
└── public/
```

### Phase 3: 배포 구조
```
deployment/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
└── scripts/
    ├── deploy.sh
    └── setup_ec2.sh
```

## 🚀 다음 작업 순서

1. **기존 파일 정리** ← 현재 진행 중
2. **FastAPI 백엔드 구현**
3. **API 엔드포인트 설계**
4. **프론트엔드 연결**
5. **EC2 배포 자동화**

## 💡 마이그레이션 전략

### 기존 코드 재사용
- AI 파이프라인 함수들을 그대로 import
- Bedrock 연결 로직 유지
- 결과 처리 로직 활용

### 새로 추가할 부분
- FastAPI 라우터
- 비동기 작업 처리
- 파일 업로드/다운로드
- 실시간 진행 상황
- 에러 핸들링

**현재 모든 AI 로직은 완성되어 있으므로, 웹 인터페이스만 추가하면 됩니다!** 🎯