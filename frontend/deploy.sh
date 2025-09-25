#!/bin/bash

# EC2 배포 스크립트
echo "🚀 Starting deployment..."

# 1. 기존 컨테이너 중지 및 제거
echo "📦 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# 2. 기존 이미지 제거 (선택사항)
echo "🗑️ Removing old images..."
docker image prune -f

# 3. 새 이미지 빌드
echo "🔨 Building new image..."
docker compose -f docker-compose.prod.yml build --no-cache

# 4. 컨테이너 실행
echo "🏃 Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# 5. 로그 확인
echo "📋 Container status:"
docker compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
echo "📌 Check logs with: docker compose -f docker-compose.prod.yml logs -f"