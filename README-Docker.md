# Docker 환경 설정

이 프로젝트는 Docker와 Docker Compose를 사용하여 개발 및 운영 환경을 구성할 수 있습니다.

## 사전 요구사항

- Docker
- Docker Compose
- Make (선택사항)

## 프로젝트 구조

```
dasibom/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── backend/
│   ├── Dockerfile (Spring Boot용)
│   ├── Dockerfile.node (Node.js용)
│   └── .dockerignore
├── docker-compose.yml (운영용)
├── docker-compose.dev.yml (개발용)
├── docker-compose.simple.yml (인프라만 실행)
├── Makefile
├── .env.example
└── README-Docker.md
```

## 빠른 시작

### 1. 환경 설정
```bash
cp .env.example .env
# .env 파일을 프로젝트에 맞게 수정하세요
```

### 2. 기본 인프라 실행 (현재 실행 중)
```bash
# 데이터베이스, Redis, Adminer만 실행
docker-compose -f docker-compose.simple.yml up -d

# 상태 확인
docker-compose -f docker-compose.simple.yml ps
```

### 3. 전체 환경 실행 (프론트엔드/백엔드 프로젝트 추가 후)
```bash
# Make 사용 시
make build
make up

# 또는 직접 Docker Compose 사용
docker-compose build
docker-compose up -d
```

### 4. 개발 환경 실행
```bash
# Make 사용 시
make dev-up

# 또는 직접 Docker Compose 사용
docker-compose -f docker-compose.dev.yml up -d
```

## 서비스 접근

### 현재 실행 중인 서비스 (docker-compose.simple.yml)
- **Adminer (DB 관리도구)**: http://localhost:8080
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

#### MySQL 접속 정보 (Adminer 사용)
- 서버: `database` (컨테이너 내부) 또는 `localhost` (외부 접속)
- 사용자명: `dasibom_user`
- 비밀번호: `dasibom_password`
- 데이터베이스: `dasibom`

### 전체 환경 (docker-compose.yml)
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- MySQL: localhost:3306
- Redis: localhost:6379

### 개발 환경 (docker-compose.dev.yml)
- Frontend: http://localhost:3001
- Backend API: http://localhost:8081
- MySQL: localhost:3307
- Debug Port: 5005

## 주요 명령어

### 기본 인프라 서비스 관리
```bash
# 인프라 서비스 시작 (현재 실행 중)
docker-compose -f docker-compose.simple.yml up -d

# 상태 확인
docker-compose -f docker-compose.simple.yml ps

# 로그 보기
docker-compose -f docker-compose.simple.yml logs -f

# 서비스 중지
docker-compose -f docker-compose.simple.yml down

# 데이터까지 모두 삭제
docker-compose -f docker-compose.simple.yml down -v
```

### Make 명령어 (전체 환경용)

| 명령어 | 설명 |
|--------|------|
| `make help` | 사용 가능한 명령어 표시 |
| `make build` | 모든 Docker 이미지 빌드 |
| `make up` | 운영 모드로 모든 서비스 시작 |
| `make down` | 모든 서비스 중지 |
| `make logs` | 모든 서비스 로그 보기 |
| `make clean` | 모든 컨테이너, 네트워크, 볼륨 제거 |
| `make dev-up` | 개발 모드로 서비스 시작 |
| `make dev-down` | 개발 서비스 중지 |
| `make status` | 모든 서비스 상태 확인 |

## 개발 팁

1. **Hot Reload**: 개발 환경에서는 소스 코드 변경 시 자동으로 반영됩니다.
2. **디버깅**: 백엔드는 5005 포트로 디버그 연결이 가능합니다.
3. **로그 확인**: `make logs` 또는 `make dev-logs`로 실시간 로그를 확인할 수 있습니다.
4. **컨테이너 접근**: `make shell-backend`, `make shell-frontend`, `make shell-db` 명령어로 컨테이너 내부에 접근할 수 있습니다.

## 문제 해결

### 포트 충돌
다른 서비스가 같은 포트를 사용하고 있다면 docker-compose.yml 또는 .env 파일에서 포트를 변경하세요.

### 권한 문제
Windows에서 볼륨 마운트 시 권한 문제가 발생할 수 있습니다. Docker Desktop 설정에서 드라이브 공유를 확인하세요.

### 캐시 문제
이미지 빌드 시 캐시 문제가 있다면 `docker-compose build --no-cache`를 사용하세요.