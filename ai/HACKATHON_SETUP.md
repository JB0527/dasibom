# 🏆 해커톤용 간단 설정 가이드

## 🎯 해야 할 것 (5분이면 끝!)

### 1. Bedrock 모델 접근 권한 요청
```
AWS 콘솔 → Bedrock (us-east-1 리전) → Model access → Request access for:
✅ Claude 3 Sonnet
✅ Stable Diffusion XL
```

### 2. EC2 인스턴스 생성
```
리전: us-west-1 (캘리포니아)
타입: t3.medium (권장)
보안그룹: SSH(22), HTTP(8000) 포트 열기
인스턴스 프로필: SafeInstanceProfileForUser-{username} 연결
```

### 3. 코드 업로드 및 실행
```bash
# EC2 접속 후
sudo apt update && sudo apt install python3-pip git -y
pip3 install boto3 pillow numpy opencv-python

# 코드 업로드 (scp 또는 git clone)
python3 bedrock_case1.py [이미지경로]
```

## 🚀 빠른 테스트

```bash
# 케이스 1: CCTV 이미지 분석 → 몽타주 생성
python3 bedrock_case1.py test_image.jpg

# 케이스 2: 인물정보 → 전신 이미지 생성  
python3 bedrock_case2.py -i person_info.json -f face.jpg

# 케이스 3: CCTV + 얼굴사진 → 수사보고서
python3 bedrock_case3.py cctv.jpg -f face.jpg
```

## 📋 체크리스트

- [ ] Bedrock 모델 접근 권한 승인됨
- [ ] EC2 t3.medium 생성됨  
- [ ] 인스턴스 프로필 연결됨
- [ ] bedrock_case*.py 파일들 업로드됨
- [ ] 테스트 이미지로 실행 확인

## 🔥 해커톤 팁

1. **모델 접근 권한 승인까지 시간이 걸릴 수 있음** → 제일 먼저 요청!
2. **us-east-1에서 Bedrock, us-west-1에서 EC2** 사용
3. **S3 버킷 이름은 {username}으로 시작**
4. **문제시 999 채널에 문의**

## 🚨 주의사항

- Access Key 대신 Role 사용 (이미 설정됨)
- 복잡한 인프라 구성 X, 핵심 기능에 집중
- Bedrock 과금 주의 (적절한 이미지 크기 사용)