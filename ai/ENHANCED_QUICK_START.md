# 🚀 Enhanced 실종자 찾기 AI - 빠른 시작 가이드

## 🎯 완전히 구현된 기능들

### ✨ 사용 가능한 모든 AI 모델
- **Claude 3.5 Sonnet**: 이미지 분석 및 특징 추출
- **Nova Canvas**: 고급 이미지 생성 및 변환
- **Titan Image Generator v2**: Super Resolution 및 이미지 생성
- **SDXL**: 이미지 개선 및 Inpainting
- **OpenCV**: 얼굴 검출 및 크롭

## 📦 필수 패키지 설치

```bash
pip install boto3 pillow numpy opencv-python
```

## 🔥 즉시 실행 가능한 명령어들

### 1. 케이스 1: CCTV 이미지만 있을 때
```bash
# 기본 실행 (Super Resolution 포함)
python bedrock_enhanced_case1.py cctv_image.jpg

# 또는 통합 스크립트로
python run_missing_person_ai.py --case 1 --cctv-image cctv_image.jpg
```

**결과물:**
- ✅ Super Resolution으로 화질 개선
- ✅ Claude 3.5로 상세 인물 분석
- ✅ Nova Canvas로 몽타주 생성
- ✅ 얼굴 자동 검출 및 크롭
- ✅ 얼굴 리파인먼트
- ✅ HTML 결과 리포트

### 2. 케이스 2: 인물 정보 + 얼굴 사진
```bash
# 전신 이미지 생성 + 얼굴 합성
python bedrock_enhanced_case2.py -i sample_person_info_enhanced.json -f face_photo.jpg

# 또는 통합 스크립트로
python run_missing_person_ai.py --case 2 --person-info sample_person_info_enhanced.json --face-image face_photo.jpg
```

**결과물:**
- ✅ Claude로 얼굴 특징 상세 분석
- ✅ Nova Canvas로 전신 이미지 생성
- ✅ 얼굴 영역 자동 검출
- ✅ SDXL Inpainting으로 얼굴 합성
- ✅ Nova Canvas로 최종 품질 개선
- ✅ 단계별 비교 이미지

### 3. 케이스 3: CCTV + 얼굴 사진 → 수사 보고서
```bash
# 상세 수사 보고서 생성
python bedrock_case3.py cctv_image.jpg -f face_photo.jpg

# 또는 통합 스크립트로
python run_missing_person_ai.py --case 3 --cctv-image cctv_image.jpg --face-image face_photo.jpg
```

**결과물:**
- ✅ CCTV 상황 맥락 분석
- ✅ 인물 세부 특징 분석
- ✅ 기존 정보와 비교 분석
- ✅ 종합 수사 보고서 생성

### 4. Super Resolution 단독 실행
```bash
# 저화질 이미지를 고화질로 변환
python bedrock_super_resolution.py low_quality_cctv.jpg

# 또는 통합 스크립트로
python run_missing_person_ai.py --super-resolution-only low_quality_cctv.jpg
```

**결과물:**
- ✅ 다단계 전처리
- ✅ Nova Canvas 업스케일링
- ✅ Titan v2 고화질 변환
- ✅ SDXL 최종 개선
- ✅ 전통적 방법과 비교

## 🤖 자동 케이스 감지

```bash
# 입력 파일에 따라 자동으로 적절한 케이스 실행
python run_missing_person_ai.py --auto --cctv-image cctv.jpg --face-image face.jpg
```

## 📁 파일 구조

```
ai/
├── bedrock_enhanced_case1.py      # 🆕 Enhanced 케이스 1
├── bedrock_enhanced_case2.py      # 🆕 Enhanced 케이스 2  
├── bedrock_case3.py               # 케이스 3 (원본)
├── bedrock_super_resolution.py    # 🆕 Super Resolution
├── run_missing_person_ai.py       # 🆕 통합 실행 스크립트
├── sample_person_info_enhanced.json # 예시 데이터
└── outputs_YYYYMMDD_HHMMSS/       # 결과 저장 폴더
```

## 🎯 해커톤에서 실제 테스트할 수 있는 워크플로우

### 1. 기본 테스트
```bash
# 1. CCTV 이미지 1개로 모든 기능 테스트
python run_missing_person_ai.py --case 1 --cctv-image test_cctv.jpg
```

### 2. 고급 테스트  
```bash
# 2. 얼굴 합성까지 포함한 풀 파이프라인
python run_missing_person_ai.py --case 2 --person-info sample_person_info_enhanced.json --face-image test_face.jpg
```

### 3. 실제 수사 시나리오
```bash
# 3. 실제 수사관이 사용할 보고서 생성
python run_missing_person_ai.py --case 3 --cctv-image test_cctv.jpg --face-image test_face.jpg
```

## 🔧 AWS 설정

### 1. Bedrock 모델 접근 권한 요청
- AWS 콘솔 → Bedrock → Model access
- ✅ Claude 3.5 Sonnet
- ✅ Nova Canvas  
- ✅ Titan Image Generator v2
- ✅ SDXL 1.0

### 2. EC2 설정 (t3.medium 권장)
```bash
# EC2에서 설치
sudo apt update
sudo apt install python3-pip
pip3 install boto3 pillow numpy opencv-python

# 인스턴스 프로필 연결: SafeInstanceProfileForUser-{username}
```

## 🎉 예상 결과물

각 케이스마다 다음과 같은 파일들이 생성됩니다:

### Case 1 결과
- `01_super_resolved.png` - 고화질 변환
- `02_claude_analysis.txt` - Claude 분석 결과  
- `03_nova_montage.png` - Nova 몽타주
- `04_face_crop_1.png` - 검출된 얼굴
- `05_refined_face_1.png` - 개선된 얼굴
- `final_report.html` - HTML 리포트

### Case 2 결과
- `01_face_analysis.txt` - 얼굴 특징 분석
- `02_generated_body.png` - 생성된 전신
- `03_face_composite.png` - 얼굴 합성
- `04_final_enhanced.png` - 최종 결과
- `05_comparison.png` - 단계별 비교

### Case 3 결과
- `bedrock_investigation_report_YYYYMMDD_HHMMSS.txt` - 수사 보고서

## 🚨 해커톤 팁

1. **모델 접근 권한을 제일 먼저 요청하세요!** (승인까지 시간 소요)
2. **t3.medium 이상 사용** (메모리 부족 방지)
3. **리전 확인**: us-east-1 (Bedrock), us-west-1 (EC2)
4. **테스트 이미지 준비**: CCTV 스타일, 얼굴 사진, 낮은 해상도 이미지

## 🏆 완전 구현된 기능

- ✅ **Nova Canvas 이미지 생성**
- ✅ **Claude 3.5 Sonnet 멀티모달 분석**  
- ✅ **Titan v2 Super Resolution**
- ✅ **SDXL Inpainting 얼굴 합성**
- ✅ **OpenCV 얼굴 검출**
- ✅ **자동 케이스 감지**
- ✅ **HTML 결과 리포트**
- ✅ **단계별 비교 이미지**
- ✅ **통합 실행 스크립트**

이제 진짜로 모든 것이 구현되었습니다! 🚀