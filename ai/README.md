# 🔍 실종자 찾기 AI 시스템

AI 기반 실종자 식별 및 몽타주 생성 시스템으로, CCTV 영상과 개인정보를 활용하여 실종자 찾기를 지원합니다.

## 📋 시스템 개요

### 핵심 기능
- **케이스별 맞춤형 처리**: 가용한 정보에 따라 최적화된 AI 처리
- **고품질 몽타주 생성**: Stable Diffusion 기반 realistic 이미지 생성
- **저화질 영상 개선**: Super Resolution 기술로 CCTV 화질 향상
- **상세한 특징 분석**: VQA 모델을 통한 인상착의 및 상황 정보 추출

### 처리 케이스
1. **케이스 1**: CCTV 이미지만 존재 → VQA 특징 추출 + 몽타주 생성
2. **케이스 2**: 구조화된 정보 + 얼굴 사진 → 전신 생성 + 얼굴 합성
3. **케이스 3**: CCTV + 얼굴 사진 → 보완 정보 추출 + 수사 보고서
4. **Super Resolution**: 저화질 CCTV 영상 고화질 변환


## 🛠️ 기술 스택

### AI 모델
- **VQA**: PaliGemma (SigLIP + Gemma) - 이미지 질의응답
- **이미지 생성**: Stable Diffusion XL - 고품질 몽타주 생성
- **얼굴 교체**: InsightFace - 정확한 얼굴 합성
- **Super Resolution**: Stable Diffusion Upscaler, Real-ESRGAN

### 핵심 라이브러리
```
torch>=2.0.0
transformers>=4.40.0
diffusers>=0.25.0
insightface
opencv-python
pillow
numpy
```

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 저장소 클론
git clone <repository-url>
cd dasibom/ai

# 가상환경 생성 (권장)
conda create -n missing-person python=3.9
conda activate missing-person

# 패키지 설치
pip install -r requirements.txt
```

### 2. 모델 다운로드
최초 실행 시 허깅페이스에서 자동으로 모델을 다운로드합니다:
- PaliGemma (약 6GB)
- Stable Diffusion XL (약 7GB)
- InsightFace 모델들 (약 500MB)

### 3. 데모 실행

#### 케이스 1: CCTV 이미지 분석 및 몽타주 생성
```bash
python demo_case1.py cctv_image.jpg
```

#### 케이스 2: 구조화된 정보로 전신 이미지 생성
```bash
python demo_case2.py -i sample_person_info.json -f face_photo.jpg
```

#### 케이스 3: 보완 정보 추출 및 수사 보고서
```bash
python demo_case3.py cctv_image.jpg -f face_photo.jpg
```

#### Super Resolution: 저화질 영상 개선
```bash
python demo_super_resolution.py low_quality_cctv.jpg
```

## 📁 프로젝트 구조

```
ai/
├── demo_case1.py              # 케이스 1: VQA → 몽타주 생성
├── demo_case2.py              # 케이스 2: 전신 생성 → 얼굴 합성
├── demo_case3.py              # 케이스 3: 보완 정보 추출
├── demo_super_resolution.py   # Super Resolution 처리
├── requirements.txt           # 패키지 의존성
├── sample_person_info.json    # 케이스 2 입력 예시
├── sample_known_info.json     # 케이스 3 기존 정보 예시
└── outputs/                   # 결과 이미지 및 보고서 저장
```

## 📊 상세 기능

### 케이스 1: CCTV 이미지 분석
**입력**: CCTV 이미지 파일
**출력**: 
- 몽타주 이미지 (`generated_montage_case1.png`)
- 체형 실루엣 (`body_silhouette_case1.png`)
- 분석 결과 텍스트

**처리 과정**:
1. PaliGemma VQA로 인상착의 14개 항목 분석
2. 추출된 정보를 Stable Diffusion 프롬프트로 변환
3. 고품질 몽타주 및 체형 실루엣 생성

### 케이스 2: 전신 이미지 합성
**입력**: 
- 인물 정보 JSON 파일
- 얼굴 참조 사진

**출력**: 
- 생성된 전신 이미지 (`generated_body.png`)
- 최종 합성 결과 (`final_result_case2.png`)

**처리 과정**:
1. 구조화된 정보를 SDXL 프롬프트로 변환
2. 전신 이미지 생성 (얼굴 제외)
3. InsightFace로 정확한 얼굴 교체

### 케이스 3: 수사 보고서 생성
**입력**: 
- CCTV 이미지
- 얼굴 참조 사진 (선택사항)
- 기존 정보 JSON (선택사항)

**출력**: 
- 종합 수사 보고서 (`investigation_report_case3.txt`)
- 핵심 단서 요약

**처리 과정**:
1. 상황 맥락 분석 (시간대, 위치, 날씨 등)
2. 인물 세부 특징 분석 (보행, 자세, 소지품 등)
3. 기존 정보와 비교하여 새로운 단서 발견
4. 카테고리별 수사 단서 정리

### Super Resolution: 화질 개선
**입력**: 저화질 CCTV 이미지

**출력**:
- 전처리된 이미지 (`01_preprocessed.png`)
- SD 4배 업스케일 (`02_stable_diffusion_4x.png`)
- Real-ESRGAN 결과 (`03_real_esrgan.png`)
- 전통적 업스케일 (`04_traditional_lanczos_4x.png`)
- 얼굴 특화 개선 (`05_final_face_enhanced.png`)
- 결과 비교 이미지

**처리 과정**:
1. 노이즈 제거 및 대비 개선
2. 다중 업스케일링 방법 적용
3. 얼굴 영역 특화 개선
4. 결과 비교 분석

## 🎯 사용 시나리오

### 실종 신고 접수 시
1. **저화질 CCTV만 있는 경우**:
   ```bash
   python demo_super_resolution.py cctv.jpg
   python demo_case1.py outputs/05_final_face_enhanced.png
   ```

2. **신고서 정보 + 얼굴 사진**:
   ```bash
   python demo_case2.py -i person_info.json -f face.jpg
   ```

3. **CCTV + 얼굴 사진 + 기존 정보**:
   ```bash
   python demo_case3.py cctv.jpg -f face.jpg -k known_info.json
   ```

### 파이프라인 연결
저화질 CCTV → Super Resolution → 케이스 1~3 순서로 연결하여 최대 효과를 얻을 수 있습니다.

## ⚙️ 설정 가이드

### GPU 메모리 최적화
```python
# 메모리 부족 시 환경변수 설정
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### 모델 캐시 설정
```python
# 허깅페이스 모델 캐시 디렉토리 설정
export HF_HOME=/path/to/huggingface/cache
```

## 📈 성능 벤치마크

### 처리 시간 (RTX 4090 기준)
- 케이스 1: 약 2-3분
- 케이스 2: 약 3-4분
- 케이스 3: 약 1-2분
- Super Resolution: 약 2-5분

### 메모리 사용량
- VRAM: 8-12GB (GPU 사용 시)
- RAM: 4-8GB

## 🚧 알려진 제한사항

1. **모델 크기**: 총 약 15GB의 모델 다운로드 필요
2. **처리 시간**: 고품질 생성을 위해 상당한 처리 시간 소요
3. **언어**: 현재 한국어 질문에 대한 영어 답변 (다국어 지원 예정)
4. **얼굴 각도**: 정면 또는 측면 얼굴에서 최적 성능

## 🛣️ 로드맵

### v2.0 (개발 중)
- [ ] FastAPI 기반 REST API 서버
- [ ] 케이스별 자동 판단 로직
- [ ] 배치 처리 기능
- [ ] 웹 UI 인터페이스

### v3.0 (계획)
- [ ] 실시간 CCTV 스트림 처리
- [ ] 다국어 지원 (한국어 VQA)
- [ ] 모바일 앱 연동
- [ ] 클라우드 배포 지원

## 🤝 기여 가이드

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 지원 및 문의

- 이슈 리포팅: GitHub Issues
- 기술 문의: [이메일 주소]
- 문서 개선: Pull Request 환영

## 📄 라이선스

이 프로젝트는 [라이선스명] 하에 배포됩니다.

---

**⚠️ 주의사항**: 이 시스템은 실종자 수색을 지원하는 도구이며, 최종 판단은 반드시 전문가가 해야 합니다.