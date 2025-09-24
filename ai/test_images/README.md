# 테스트 이미지 폴더

이 폴더는 AI 모델 테스트를 위한 이미지들을 저장하는 공간입니다.

## 폴더 구조
```
test_images/
├── cctv/          # CCTV 이미지 (케이스 1, 3용)
├── faces/         # 얼굴 참조 사진 (케이스 2, 3용)  
├── low_quality/   # 저화질 이미지 (Super Resolution용)
└── samples/       # 샘플 이미지들
```

## 사용법

### 케이스 1 테스트
```bash
python demo_case1.py test_images/cctv/person1.jpg
```

### 케이스 2 테스트
```bash  
python demo_case2.py -i sample_person_info.json -f test_images/faces/face1.jpg
```

### 케이스 3 테스트
```bash
python demo_case3.py test_images/cctv/person1.jpg -f test_images/faces/face1.jpg
```

### Super Resolution 테스트
```bash
python demo_super_resolution.py test_images/low_quality/blurry_cctv.jpg
```

## 이미지 준비 가이드

### CCTV 이미지 (cctv/)
- **용도**: 인물 특징 분석, 상황 맥락 분석
- **권장 형식**: JPG, PNG
- **권장 크기**: 512x512 이상
- **주의사항**: 인물이 명확히 보이는 이미지

### 얼굴 사진 (faces/)  
- **용도**: 얼굴 합성, 참조
- **권장 형식**: JPG, PNG
- **권장 크기**: 512x512 이상
- **주의사항**: 정면 또는 측면 얼굴, 선명한 이미지

### 저화질 이미지 (low_quality/)
- **용도**: Super Resolution 테스트
- **권장 형식**: JPG, PNG  
- **특징**: 흐릿하거나 저해상도인 이미지
- **크기**: 제한 없음

## 프라이버시 주의사항

⚠️ **중요**: 실제 실종자나 개인 정보가 포함된 이미지는 사용하지 마세요.

- 테스트용으로는 공개 데이터셋이나 AI 생성 이미지 사용 권장
- 실제 운영 시에는 데이터 보안 및 개인정보 보호 정책 준수
- 이 폴더는 .gitignore에 포함되어 Git 추적되지 않음

## 샘플 이미지 구하기

### 공개 데이터셋
- WIDER FACE (얼굴 데이터셋)
- CelebA (셀럽 얼굴 데이터셋)  
- COCO Dataset (일반 인물 이미지)

### AI 생성 이미지
- ThisPersonDoesNotExist.com
- Generated Photos
- Stable Diffusion으로 직접 생성

### 무료 스톡 이미지
- Unsplash
- Pixabay
- Pexels