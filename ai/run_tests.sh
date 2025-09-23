#!/bin/bash

# 실종자 찾기 AI 테스트 스크립트
# 모든 케이스에 대한 테스트를 순차적으로 실행

echo "🔍 실종자 찾기 AI 테스트 시작"
echo "================================"

# 테스트 이미지 존재 확인
check_file() {
    if [ ! -f "$1" ]; then
        echo "❌ 파일이 없습니다: $1"
        echo "   test_images/ 폴더에 테스트 이미지를 추가해주세요."
        exit 1
    fi
}

# 결과 폴더 생성
mkdir -p test_results
rm -rf test_results/*

echo ""
echo "📁 테스트 이미지 확인 중..."

# 테스트 이미지들 (실제로는 사용자가 추가해야 함)
CCTV_IMAGE="test_images/cctv/sample_cctv.jpg"
FACE_IMAGE="test_images/faces/sample_face.jpg" 
LOW_QUALITY_IMAGE="test_images/low_quality/blurry_sample.jpg"

# 케이스 1 테스트
echo ""
echo "🎯 케이스 1 테스트: CCTV 이미지 → 몽타주 생성"
echo "----------------------------------------"
if [ -f "$CCTV_IMAGE" ]; then
    echo "실행: python demo_case1.py $CCTV_IMAGE --output test_results/case1"
    python demo_case1.py "$CCTV_IMAGE" --output test_results/case1
    if [ $? -eq 0 ]; then
        echo "✅ 케이스 1 테스트 완료"
    else
        echo "❌ 케이스 1 테스트 실패"
    fi
else
    echo "⏭️  케이스 1 스킵: $CCTV_IMAGE 파일이 없습니다."
fi

# 케이스 2 테스트  
echo ""
echo "🎯 케이스 2 테스트: 구조화된 정보 → 전신 합성"
echo "----------------------------------------"
if [ -f "$FACE_IMAGE" ]; then
    echo "실행: python demo_case2.py -i sample_person_info.json -f $FACE_IMAGE --output test_results/case2"
    python demo_case2.py -i sample_person_info.json -f "$FACE_IMAGE" --output test_results/case2
    if [ $? -eq 0 ]; then
        echo "✅ 케이스 2 테스트 완료"
    else
        echo "❌ 케이스 2 테스트 실패"
    fi
else
    echo "⏭️  케이스 2 스킵: $FACE_IMAGE 파일이 없습니다."
fi

# 케이스 3 테스트
echo ""
echo "🎯 케이스 3 테스트: 보완 정보 추출 → 수사 보고서"
echo "----------------------------------------"
if [ -f "$CCTV_IMAGE" ] && [ -f "$FACE_IMAGE" ]; then
    echo "실행: python demo_case3.py $CCTV_IMAGE -f $FACE_IMAGE -k sample_known_info.json --output test_results/case3"
    python demo_case3.py "$CCTV_IMAGE" -f "$FACE_IMAGE" -k sample_known_info.json --output test_results/case3
    if [ $? -eq 0 ]; then
        echo "✅ 케이스 3 테스트 완료"
    else
        echo "❌ 케이스 3 테스트 실패"
    fi
else
    echo "⏭️  케이스 3 스킵: 필요한 이미지 파일이 없습니다."
fi

# Super Resolution 테스트
echo ""
echo "🎯 Super Resolution 테스트: 저화질 → 고화질 변환"
echo "----------------------------------------"
if [ -f "$LOW_QUALITY_IMAGE" ]; then
    echo "실행: python demo_super_resolution.py $LOW_QUALITY_IMAGE --output test_results/super_resolution"
    python demo_super_resolution.py "$LOW_QUALITY_IMAGE" --output test_results/super_resolution
    if [ $? -eq 0 ]; then
        echo "✅ Super Resolution 테스트 완료"
    else
        echo "❌ Super Resolution 테스트 실패"
    fi
else
    echo "⏭️  Super Resolution 스킵: $LOW_QUALITY_IMAGE 파일이 없습니다."
fi

# 결과 요약
echo ""
echo "📊 테스트 결과 요약"
echo "================="
echo "결과 폴더: test_results/"
echo ""
echo "생성된 파일들:"
find test_results -name "*.png" -o -name "*.jpg" -o -name "*.txt" | sort
echo ""
echo "🎉 전체 테스트 완료!"
echo ""
echo "💡 다음 단계:"
echo "1. test_results/ 폴더의 결과 이미지들을 확인하세요"
echo "2. 품질이 만족스럽지 않다면 이미지를 교체하고 다시 테스트하세요"
echo "3. API 서버를 실행하여 통합 테스트를 진행하세요"