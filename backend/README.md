# Dasibom Backend API Server

> Java 21 + Spring Boot 3.3.0 + PostgreSQL(PostGIS) + Redis

## 🚀 Quick Start

### 🔥 Local Development (권장)
**DB, Redis만 도커로, 백엔드는 IDE에서 실행**

```bash
# 1. DB, Redis, 개발도구만 도커로 실행 (프로젝트 루트에서)
docker compose -f docker-compose.local.yml up -d

# 2. IDE에서 백엔드 실행
# - IntelliJ: Application 실행 구성으로 App.java 실행
# - VS Code: Spring Boot Dashboard 또는 터미널에서 ./gradlew bootRun
# - Eclipse: Run As > Spring Boot App

# 3. 개발 완료 후 정리
docker compose -f docker-compose.local.yml down
```

### Full Development Environment
**모든 것을 도커로 실행**
```bash
# 프로젝트 루트에서 실행
docker compose -f docker-compose.dev.yml up -d

# 또는 단계별 실행
docker compose -f docker-compose.dev.yml up -d database redis  # DB, Redis만 먼저
docker compose -f docker-compose.dev.yml up -d backend         # 백엔드 추가
```

### Production Environment
```bash
# 프로젝트 루트에서 실행
docker compose up -d
```

## 🔐 현재 인증 정보

### Default Spring Security
- **Username**: `user`
- **Password**: `e55b5b1d-3420-47d0-b45d-ba801953107f`
- **Type**: Basic Authentication

> ⚠️ **중요**: 매번 컨테이너 재시작시 패스워드가 변경됩니다. 최신 패스워드는 로그에서 확인하세요.

```bash
# 최신 패스워드 확인
docker logs dasibom-backend | grep "security password"
```

### API 테스트 예시
```bash
# Basic Auth로 API 호출
curl -u user:e55b5b1d-3420-47d0-b45d-ba801953107f http://localhost:8080/

# 응답 예시
{"success":false,"data":null,"error":"Unexpected error"}
```

## 🌐 서비스 접속 정보

### 백엔드 API
- **URL**: http://localhost:8080
- **Health Check**: http://localhost:8080/actuator/health (actuator 의존성 추가 필요)
- **Profile**: `prod` (운영) / `dev` (개발)

### 데이터베이스 (PostgreSQL + PostGIS)
- **Host**: localhost
- **Port**: 5432
- **Database**: dasibom (운영) / dasibom_dev (개발)
- **Username**: dasibom_user (운영) / dev_user (개발)
- **Password**: 환경변수 참조 (.env 파일)

### Redis
- **Host**: localhost
- **Port**: 6379
- **Password**: 없음 (기본 설정)

### 개발 도구 (개발환경에서만)
- **pgAdmin**: http://localhost:5050
  - Email: admin@dasibom.com
  - Password: admin123
- **MailHog**: http://localhost:8025 (이메일 테스트)

## 💻 IDE 설정 (로컬 개발)

### IntelliJ IDEA
1. **프로젝트 열기**: `backend` 폴더를 루트로 열기
2. **Java SDK 설정**: Project Structure > Project > SDK를 Java 21로 설정
3. **Gradle 설정**: Gradle JVM을 Java 21로 설정
4. **실행 구성**:
   - Main class: `site.dasibom.App`
   - VM options: `-Dspring.profiles.active=dev`
   - Environment variables: 
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=dasibom_dev
     DB_USERNAME=dev_user
     DB_PASSWORD=dev_password
     REDIS_HOST=localhost
     REDIS_PORT=6379
     ```

### VS Code
1. **확장 프로그램 설치**:
   - Extension Pack for Java
   - Spring Boot Extension Pack
2. **설정 파일** (`.vscode/launch.json`):
   ```json
   {
     "type": "java",
     "name": "Spring Boot-App",
     "request": "launch",
     "cwd": "${workspaceFolder}",
     "mainClass": "site.dasibom.App",
     "projectName": "dasibom",
     "env": {
       "SPRING_PROFILES_ACTIVE": "dev",
       "DB_HOST": "localhost",
       "DB_PORT": "5432",
       "DB_NAME": "dasibom_dev",
       "DB_USERNAME": "dev_user",
       "DB_PASSWORD": "dev_password",
       "REDIS_HOST": "localhost",
       "REDIS_PORT": "6379"
     }
   }
   ```

### 터미널에서 실행
```bash
# 백엔드 디렉토리에서
export SPRING_PROFILES_ACTIVE=dev
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=dasibom_dev
export DB_USERNAME=dev_user
export DB_PASSWORD=dev_password
export REDIS_HOST=localhost
export REDIS_PORT=6379

./gradlew bootRun
```

### 🎯 로컬 개발 워크플로우
```bash
# 1. 도커로 DB, Redis만 실행
docker compose -f docker-compose.local.yml up -d

# 2. 서비스 확인
docker ps  # database, redis, pgadmin, mailhog가 실행 중인지 확인

# 3. IDE에서 백엔드 실행 (또는 ./gradlew bootRun)

# 4. 개발 진행
# - Hot reload 지원 (spring-boot-devtools)
# - 디버그 모드로 브레이크포인트 설정 가능
# - 실시간 코드 변경 반영

# 5. 개발 완료 후
docker compose -f docker-compose.local.yml down
```

## 🔧 빌드 정보

### Docker 이미지 정보
- **Base Image**: `gradle:8.5-jdk21` (빌드) + `openjdk:21-jdk-slim` (런타임)
- **Multi-stage Build**: 최적화된 이미지 크기
- **Health Check**: 내장 (curl 기반)
- **Non-root User**: 보안 강화

### Gradle 빌드
```bash
# 로컬 빌드 (백엔드 폴더에서)
./gradlew clean build -x test

# Docker 빌드 (프로젝트 루트에서)
docker build -t dasibom-backend ./backend
```

### JVM 설정
**개발환경**:
```bash
-Xms256m -Xmx512m
-Dspring.devtools.restart.enabled=true
-Dspring.devtools.livereload.enabled=true
-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005
```

**운영환경**:
```bash
-Xms512m -Xmx1024m
-XX:+UseG1GC
-XX:G1HeapRegionSize=16m
-XX:+UseStringDeduplication
```

## 🔗 프론트엔드 연결 가이드

### CORS 설정
현재 모든 오리진 허용 상태. 운영환경에서는 특정 도메인으로 제한 필요.

### API Base URL
- **Development**: `http://localhost:8080`
- **Production**: `https://yourdomain.com` (도메인 설정 후)

### 인증 헤더 설정
```javascript
// Axios 예시
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  auth: {
    username: 'user',
    password: 'e55b5b1d-3420-47d0-b45d-ba801953107f'
  }
});

// Fetch API 예시
const response = await fetch('http://localhost:8080/api/endpoint', {
  headers: {
    'Authorization': 'Basic ' + btoa('user:e55b5b1d-3420-47d0-b45d-ba801953107f'),
    'Content-Type': 'application/json'
  }
});
```

### React/Next.js 환경변수 설정
```bash
# .env.local
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_API_USERNAME=user
REACT_APP_API_PASSWORD=e55b5b1d-3420-47d0-b45d-ba801953107f
```

## 📊 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 정보
- `missing_case` - 실종자 케이스 (PostGIS Point 필드 포함)
- `report` - 제보 정보 (PostGIS Point 필드 포함)
- `case_contact` - 케이스 연락처
- `movement_prediction` - 이동 예측 (PostGIS Point 필드 포함)
- `api_request_log` - API 요청 로그

### PostGIS 기능
- **Spatial Data Types**: Point, Polygon 등 지원
- **Spatial Functions**: 거리 계산, 위치 검색 등
- **SRID**: 4326 (WGS84) 사용 권장

## 🔗 외부 API 연동

### Safe182 실종경보 API
- **Base URL**: https://www.safe182.go.kr
- **Endpoint**: `/api/lcm/amberList.do` (POST)
- **기능**: 정부 공식 실종자 정보 조회 및 동기화

#### 환경변수 설정 (.env 파일)
```bash
SAFE182_AUTH_KEY=your_auth_key_here
SAFE182_ESNTL_ID=your_esntl_id_here
SAFE182_SCHEDULER_ENABLED=true  # 스케줄러 활성화 (기본값: true)
```

#### API 엔드포인트
```bash
# Safe182 데이터 동기화
POST /api/external/safe182/sync

# 실종자 검색
GET /api/external/safe182/search?name=홍길동&gender=1&ageFrom=10&ageTo=20

# API 연결 테스트
GET /api/external/safe182/test

# 스케줄러 관리
POST /api/scheduler/safe182/sync-now    # 수동 동기화 실행
GET /api/scheduler/status               # 스케줄러 상태 조회
GET /api/scheduler/config               # 스케줄러 설정 조회
```

#### 🕐 자동 스케줄러
- **실행 간격**: 5분마다 자동 실행
- **시작 시점**: 애플리케이션 시작 후 즉시 시작
- **실행 방식**: `fixedRate = 300000ms` (정확히 5분마다)
- **로그**: 실행 시작/완료 시 자동 로그 기록
- **제어**: 환경변수로 활성화/비활성화 가능

#### 사용 예시
```javascript
// 데이터 동기화
const syncResponse = await fetch('/api/external/safe182/sync', {
  method: 'POST',
  headers: { 'Authorization': 'Basic ' + btoa('user:password') }
});

// 실종자 검색
const searchResponse = await fetch('/api/external/safe182/search?name=홍길동', {
  headers: { 'Authorization': 'Basic ' + btoa('user:password') }
});
```

## 🐛 디버깅

### 디버그 포트 (개발환경)
- **Port**: 5005
- **IDE 연결**: Remote JVM Debug 설정

### 로그 확인
```bash
# 백엔드 로그
docker logs dasibom-backend -f

# 데이터베이스 로그
docker logs dasibom-db -f

# 모든 서비스 로그
docker compose logs -f
```

### 자주 발생하는 문제

#### 1. 인증 실패 (401 Unauthorized)
- 패스워드가 변경되었는지 확인
- Basic Auth 헤더 형식 확인

#### 2. 데이터베이스 연결 실패
- 컨테이너 시작 순서 확인 (DB → Backend)
- 환경변수 설정 확인

#### 3. Port 충돌
- 이미 사용 중인 포트 확인: `lsof -i :8080`
- Docker Compose 포트 설정 변경

## 📁 프로젝트 구조

```
backend/
├── src/main/java/site/dasibom/
│   ├── domain/           # 도메인별 패키지
│   │   ├── auth/        # 인증 관련
│   │   ├── missingcase/ # 실종자 케이스
│   │   └── report/      # 제보 관련
│   ├── global/          # 공통 설정
│   └── App.java         # 메인 애플리케이션
├── src/main/resources/
│   └── application.yml  # 설정 파일
├── build.gradle         # 의존성 및 빌드 설정
├── Dockerfile          # Docker 이미지 빌드
└── README.md           # 이 문서
```

## 🚀 배포 (EC2)

### 환경변수 설정
```bash
# .env 파일 수정
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
CORS_ORIGINS=https://yourdomain.com
```

### SSL 설정 (Nginx)
- Let's Encrypt 인증서 설정
- HTTP → HTTPS 리다이렉션
- Reverse Proxy 설정

### 보안 체크리스트
- [ ] 기본 패스워드 변경
- [ ] JWT Secret 설정
- [ ] CORS 도메인 제한
- [ ] 데이터베이스 접근 제한
- [ ] 방화벽 설정
- [ ] SSL 인증서 적용

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Docker 컨테이너 상태: `docker ps`
2. 애플리케이션 로그: `docker logs dasibom-backend`
3. 환경변수 설정: `.env` 파일 확인
4. 포트 충돌: `lsof -i :8080`

**🎉 Happy Coding!**