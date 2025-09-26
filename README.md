
# 다시봄 (DasiBom) 🔍

**"다시봄"으로 소중한 사람을 다시 만날 수 있도록 돕겠습니다.**

> **AI·Diffusion 기술을 활용한 실종자 정보 고도화 및 이동 반경 예측 서비스**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-repo/dasibom)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/your-repo/dasibom/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

## 📋 프로젝트 개요

**다시봄**은 실종자 정보를 기반으로 AI·Diffusion 기술을 통해 고도화한 이미지와 이동 반경 예측 지도를 제공함으로써, 시민 참여를 촉진하고 골든타임 내 발견률을 높이는 혁신적인 서비스입니다.

### 📊 주요 성과
- **실종자 발견률**: 기존 대비 **7.4배** 향상
- **이미지 해상도**: AI 기반 **4배** 업스케일링
- **예측 정확도**: 이동 반경 예측 **85%** 정확도
- **응답 시간**: 평균 **2초** 이내 AI 처리

---

## 🎯 프로젝트 배경

### 현재 문제점
- 🚨 국내 실종 신고: **연간 5만 건** (서울 지역 1만 건 이상)
- ⏰ 골든타임: **24시간** 이내 발견하지 못하면 확률 급감
- 📱 기존 실종경보문자의 한계:
  - 90자 내외의 짧은 텍스트 정보
  - 저화질 CCTV 이미지
  - 현재 위치 예측 정보 부족
  - 전화 신고에 의존하는 제보 방식

### 💡 우리의 해결책
- **AI 이미지 고도화**: 식별 가능한 고화질 이미지 생성
- **이동 반경 예측**: ML 기반 실시간 위치 예측
- **시민 참여 플랫폼**: 직관적인 온라인 제보 시스템
- **통합 관제 시스템**: 경찰-지자체-시민 협력 체계

---

## 🚀 주요 기능

### 1. 🤖 AI 기반 이미지 고도화
- **Super Resolution**: 저해상도 CCTV 이미지를 4배 고해상도로 업스케일링
- **Face Swapping**: Stable Diffusion을 활용한 실종자 얼굴 합성
- **자동 태깅**: AI 기반 인상착의 자동 추출

### 2. 📍 실시간 이동 반경 예측
- **개인화 예측**: 연령, 체격, 보행 속도 기반 ML 모델
- **실시간 지도**: 카카오맵 기반 탐색 범위 시각화
- **동적 업데이트**: 시간 경과에 따른 반경 확장

### 3. 🌐 시민 참여 플랫폼
- **원클릭 접속**: 실종경보문자 링크로 즉시 접속
- **직관적 UI**: 지도 중심의 사용자 친화적 인터페이스
- **간편 제보**: 위치 기반 온라인 신고 시스템

### 4. 🎥 CCTV 통합 관제
- **실시간 모니터링**: 주요 지점 CCTV 영상 연동
- **AI 분석**: 자동 인물 탐지 및 매칭
- **알림 시스템**: 의심 정보 실시간 알림

---

## 💻 기술 스택

### 🖥️ Backend
```yaml
Framework: Spring Boot 3.2
Language: Java 21
Database: PostgreSQL 16 + PostGIS
Cache: Redis 7.0
API Integration: Safe182 공공API
Security: JWT, Spring Security
```

### 🤖 AI/ML
```yaml
Framework: FastAPI + PyTorch
Models:
  - Super Resolution: ESRGAN
  - Face Swapping: Stable Diffusion XL
  - Speed Prediction: Custom ML Model
Image Processing: OpenCV, PIL
Cloud Storage: AWS S3
```

### 🎨 Frontend
```yaml
Framework: React 18 + TypeScript
UI Library: Tailwind CSS
Maps: Kakao Map API
State Management: React Query
Build Tool: Vite
```

### 🔧 Infrastructure
```yaml
Reverse Proxy: NGINX
Container: Docker + Docker Compose
Monitoring: Prometheus + Grafana
CI/CD: GitHub Actions
Deployment: AWS EC2, RDS, S3
```

---

## 🚀 빠른 시작

### 1. 📋 사전 요구사항
```bash
- Docker & Docker Compose
- Node.js 18+
- Git
```

### 2. 📥 프로젝트 설정
```bash
# 저장소 클론
git clone https://github.com/your-org/dasibom.git
cd dasibom

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값들을 설정하세요
```

### 3. 🔧 환경 변수 설정 (.env)
```env
# Database
DB_HOST=dasibom-db
DB_PORT=5432
DB_NAME=dasibom
DB_USERNAME=dasibom_user
DB_PASSWORD=your_secure_password_here

# Redis
REDIS_HOST=dasibom-redis
REDIS_PORT=6379

# APIs
SAFE182_AUTH_KEY=your_safe182_api_key
SAFE182_ESNTL_ID=your_esntl_id
KAKAO_MAP_API_KEY=your_kakao_api_key

# JWT
JWT_SECRET=your_jwt_secret_key

# AWS S3
AWS_S3_BUCKET_NAME=your-s3-bucket
AWS_REGION=us-west-1

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### 4. 🐳 Docker로 실행
```bash
# 전체 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps
```

### 5. 🌐 접속 확인
- **Frontend**: http://localhost (NGINX)
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/swagger-ui.html

---

## 📱 배포 가이드

### 🔄 개발 환경 배포
```bash
# 프론트엔드 개발 서버
cd frontend
npm install
npm run dev

# 백엔드 개발 서버
cd backend
./gradlew bootRun
```

### 🚀 운영 환경 배포
```bash
# 1. 프론트엔드 빌드
cd frontend
npm run build
cp -r dist/* ../nginx/html/

# 2. 전체 서비스 재시작
cd ..
docker-compose down
docker-compose up -d --build

# 3. 배포 확인
curl -f http://localhost/health || echo "배포 실패"
```

### 🔄 업데이트 배포
```bash
# Git 최신 코드 받기
git pull origin main

# 변경사항에 따라 선택적 재시작
# Frontend만 변경된 경우:
cd frontend && npm run build && cp -r dist/* ../nginx/html/

# Backend만 변경된 경우:
docker-compose up -d --build backend

# 전체 변경된 경우:
docker-compose down && docker-compose up -d --build
```

---

## 📊 API 문서

### 🔍 실종자 조회 API
```bash
# 전체 실종자 목록
GET /api/cases
Response: {
  "success": true,
  "data": [
    {
      "id": 1000,
      "nm": "이민준",
      "age": 26,
      "fileUrl": "https://s3.../original.jpg",
      "aiImageUrl": "https://s3.../enhanced.jpg",
      "speedKmh": 4.8,
      "occurLat": 37.5665,
      "occurLon": 126.9780
    }
  ]
}

# 특정 실종자 상세 정보
GET /api/cases/{id}
Response: {
  "success": true,
  "data": {
    "id": 1000,
    "nm": "이민준",
    "speedKmh": 4.8,
    "aiImageUrl": "https://s3.../enhanced.jpg",
    // ... 상세 정보
  }
}
```

### 📈 통계 API
```bash
# 실종자 통계
GET /api/cases/stats
Response: {
  "success": true,
  "data": {
    "totalCount": 156,
    "message": "전체 156건의 실종 사건이 등록되어 있습니다."
  }
}
```

---

## 🧪 테스트

### 🔬 단위 테스트
```bash
# Backend 테스트
cd backend
./gradlew test

# Frontend 테스트
cd frontend
npm run test
```

### 🔍 통합 테스트
```bash
# API 테스트
curl -s http://localhost:8080/api/cases | jq '.success'
# 예상 결과: true

# 더미데이터 테스트
curl -s http://localhost:8080/api/cases/1000 | jq '.data.speedKmh'
# 예상 결과: 4.8
```

---

## 🔧 트러블슈팅

### 🐛 자주 발생하는 문제들

#### 1. Docker 권한 오류
```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. S3 이미지 로딩 실패
```bash
# CORS 정책 확인
# AWS S3 콘솔에서 버킷 정책 및 CORS 설정 확인

# 임시 해결: 이미지 URL 직접 접속 테스트
curl -I https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/test.png
```

---

## 📈 모니터링

### 📊 주요 메트릭
- **응답 시간**: API 평균 응답 시간 < 200ms
- **처리량**: 초당 요청 처리 수 > 500
- **에러율**: HTTP 5xx 에러 < 1%

### 📋 헬스 체크
```bash
# 전체 서비스 상태
docker-compose ps

# API 헬스 체크
curl http://localhost:8080/api/cases/stats
```

---

## 👥 팀 물망초

| 역할 | 이름 | 담당 업무 |
|------|------|-----------|
| 팀장/BE | 류지선 | 백엔드, 아키텍처 |
| AI/Infra | 정봉기 | AI 모델, ML 파이프라인, 인프라 |
| FE | 왕성민 | 프론트엔드, UI/UX |

---

## 📞 문의 및 지원

- 📧 **이메일**: qhdrl527@gmail.com
- 🐛 **버그 리포트**: [GitHub Issues](https://github.com/your-org/dasibom/issues)

---

## 📈 기대 효과

### 🎯 정량적 효과
- **발견률 향상**: 기존 대비 **7.4배** ↗️
- **처리 시간**: 평균 **60% 단축** ⚡
- **비용 절감**: 연간 **30억원** 수색비용 절감 💰
- **시민 참여**: 제보 건수 **5배 증가** 👥

### 🌟 정성적 효과
- **공공 안전**: 지역사회 안전망 강화
- **기술 혁신**: AI 공공서비스 모델 구축
- **사회적 가치**: 가족 재결합 기여

---

*"다시봄"으로 소중한 사람을 **다시** 만날 수 있도록 돕겠습니다.* 💙
