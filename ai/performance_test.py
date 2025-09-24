# 🔥 즉시 성능 비교 테스트
# 기존 vs 개선 버전 직접 비교

import subprocess
import time
import os

def run_performance_comparison():
    """성능 비교 테스트 자동 실행"""
    
    print("🚀 실종자 찾기 AI - 성능 비교 테스트 시작")
    print("=" * 50)
    
    # 테스트 이미지 경로
    test_cctv = "test_images/cctv/cctv이미지_얼굴선명.png"
    test_face = "test_images/faces/정봉기증사.png" 
    test_info = "sample_person_info.json"
    
    # 테스트 파일 존재 확인
    if not os.path.exists(test_cctv):
        print(f"❌ 테스트 CCTV 이미지 없음: {test_cctv}")
        return
        
    print(f"✅ 테스트 이미지 확인: {test_cctv}")
    print()
    
    # 1. 기존 버전 테스트
    print("📊 1단계: 기존 버전 (SD 1.5) 테스트")
    print("-" * 30)
    
    start_time = time.time()
    try:
        result = subprocess.run([
            "python", "demo_case1.py", 
            test_cctv, 
            "-o", "comparison_test/original"
        ], capture_output=True, text=True, timeout=300)  # 5분 타임아웃
        
        original_time = time.time() - start_time
        
        if result.returncode == 0:
            print(f"✅ 기존 버전 완료: {original_time:.1f}초")
        else:
            print(f"❌ 기존 버전 실패: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("⏰ 기존 버전 타임아웃 (5분 초과)")
        original_time = 300
    except Exception as e:
        print(f"❌ 기존 버전 오류: {e}")
        original_time = 0
    
    print()
    
    # 2. 개선 버전 테스트
    print("⭐ 2단계: 개선 버전 (SDXL) 테스트") 
    print("-" * 30)
    
    start_time = time.time()
    try:
        result = subprocess.run([
            "python", "demo_case1_enhanced.py",
            test_cctv,
            "-o", "comparison_test/enhanced", 
            "-v", "3"  # 3개 변형
        ], capture_output=True, text=True, timeout=600)  # 10분 타임아웃
        
        enhanced_time = time.time() - start_time
        
        if result.returncode == 0:
            print(f"✅ 개선 버전 완료: {enhanced_time:.1f}초")
        else:
            print(f"❌ 개선 버전 실패: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("⏰ 개선 버전 타임아웃 (10분 초과)")
        enhanced_time = 600
    except Exception as e:
        print(f"❌ 개선 버전 오류: {e}")
        enhanced_time = 0
    
    print()
    
    # 3. 결과 비교
    print("🏆 성능 비교 결과")
    print("=" * 30)
    print(f"기존 SD 1.5:  {original_time:.1f}초")
    print(f"개선 SDXL:    {enhanced_time:.1f}초")
    
    if original_time > 0 and enhanced_time > 0:
        ratio = enhanced_time / original_time
        print(f"시간 비율:    {ratio:.1f}x")
        
        if ratio < 1.5:
            print("⚡ 비슷한 속도로 고품질 달성!")
        elif ratio < 2.0:
            print("⭐ 약간 느리지만 품질 크게 향상!")
        else:
            print("🎯 시간 대비 품질 트레이드오프")
    
    print()
    print("📁 결과 파일 위치:")
    print(f"  기존 버전: comparison_test/original/")
    print(f"  개선 버전: comparison_test/enhanced/")
    print()
    print("👀 육안 비교 권장:")
    print(f"  기존: comparison_test/original/montage.png")
    print(f"  개선: comparison_test/enhanced/enhanced_montage_best.png")
    print(f"  변형들: comparison_test/enhanced/enhanced_variation_*.png")

if __name__ == "__main__":
    run_performance_comparison()
