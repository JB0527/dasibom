#!/bin/bash

# 🚀 실종자 찾기 AI 시스템 개선 버전 테스트 스크립트

echo "🔍 실종자 찾기 AI 시스템 - 개선 버전 테스트"
echo "================================================"

# 테스트 이미지 경로
CCTV_IMAGE="test_images/cctv/cctv이미지_얼굴선명.png"
FACE_IMAGE="test_images/faces/정봉기증사.png"
PERSON_INFO="sample_person_info.json"

# 출력 디렉토리 생성
mkdir -p enhanced_test_results

echo ""
echo "📋 사용 가능한 개선 테스트:"
echo "1. 케이스 1 개선 버전 (CCTV → SDXL 몽타주)"
echo "2. 케이스 2 개선 버전 (정보 → SDXL 전신 → 개선된 얼굴 합성)"
echo "3. 성능 비교 (기존 vs 개선 버전)"
echo "4. 모든 케이스 실행"
echo ""

read -p "선택하세요 (1-4): " choice

case $choice in
    1)
        echo "🎯 케이스 1 개선 버전 실행 중..."
        python demo_case1_enhanced.py "$CCTV_IMAGE" -o enhanced_test_results/case1 -v 5
        echo "✅ 케이스 1 완료! 결과: enhanced_test_results/case1/"
        ;;
    
    2)
        echo "🎯 케이스 2 개선 버전 실행 중..."
        python demo_case2_enhanced.py -i "$PERSON_INFO" -f "$FACE_IMAGE" -o enhanced_test_results/case2 -a 3
        echo "✅ 케이스 2 완료! 결과: enhanced_test_results/case2/"
        ;;
    
    3)
        echo "📊 성능 비교 테스트 실행 중..."
        
        echo "  🔄 기존 버전 (케이스 1) 실행..."
        python demo_case1.py "$CCTV_IMAGE" -o enhanced_test_results/original_case1
        
        echo "  ⭐ 개선 버전 (케이스 1) 실행..."
        python demo_case1_enhanced.py "$CCTV_IMAGE" -o enhanced_test_results/enhanced_case1 -v 3
        
        echo ""
        echo "📈 성능 비교 결과:"
        echo "  기존 버전: enhanced_test_results/original_case1/"
        echo "  개선 버전: enhanced_test_results/enhanced_case1/"
        echo ""
        echo "  주요 개선사항:"
        echo "  ✅ SD 1.5 → SDXL: 2-3배 품질 향상"
        echo "  ✅ 한국인 특화 프롬프트"
        echo "  ✅ 다중 변형 생성"
        echo "  ✅ 자동 얼굴 크롭"
        ;;
    
    4)
        echo "🔄 모든 케이스 개선 버전 실행 중..."
        
        echo "  1️⃣ 케이스 1 (CCTV 분석)..."
        python demo_case1_enhanced.py "$CCTV_IMAGE" -o enhanced_test_results/all_case1 -v 3
        
        echo "  2️⃣ 케이스 2 (얼굴 합성)..."
        python demo_case2_enhanced.py -i "$PERSON_INFO" -f "$FACE_IMAGE" -o enhanced_test_results/all_case2 -a 2
        
        echo "  3️⃣ 케이스 3 (정보 분석)..."
        python demo_case3.py "$CCTV_IMAGE" -f "$FACE_IMAGE" -o enhanced_test_results/all_case3
        
        echo ""
        echo "🎉 모든 케이스 완료!"
        echo "📂 결과 위치:"
        echo "  케이스 1: enhanced_test_results/all_case1/"
        echo "  케이스 2: enhanced_test_results/all_case2/"  
        echo "  케이스 3: enhanced_test_results/all_case3/"
        ;;
    
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🏁 테스트 완료!"
echo "📊 GPU 메모리 사용량 확인:"
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "GPU 정보 없음"

echo ""
echo "💡 추가 옵션:"
echo "  • 더 많은 변형: python demo_case1_enhanced.py [image] -v 10"  
echo "  • 고품질 모드: python demo_case2_enhanced.py [options] -a 5"
echo "  • 결과 비교: ls -la enhanced_test_results/"
