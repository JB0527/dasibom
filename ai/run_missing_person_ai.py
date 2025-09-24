#!/usr/bin/env python3
"""
통합 실종자 찾기 AI 시스템 실행 스크립트
AWS Bedrock 기반 - 모든 케이스와 Super Resolution 통합
"""

import os
import sys
import argparse
import json
from datetime import datetime
from pathlib import Path

# Enhanced 버전 모듈들 임포트
try:
    from bedrock_enhanced_case1 import EnhancedBedrockCase1
    from bedrock_enhanced_case2 import EnhancedBedrockCase2
    from bedrock_case3 import BedrockMissingPersonCase3
    from bedrock_super_resolution import BedrockSuperResolution
except ImportError as e:
    print(f"❌ 모듈 임포트 실패: {e}")
    print("필요한 파일들이 같은 디렉토리에 있는지 확인하세요.")
    sys.exit(1)

class MissingPersonAIOrchestrator:
    """전체 AI 시스템 통합 관리"""
    
    def __init__(self, region='us-east-1'):
        self.region = region
        self.base_output = f"outputs_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        print("🚀 실종자 찾기 AI 시스템 초기화")
        print(f"📁 기본 출력 디렉토리: {self.base_output}")
        print(f"🌍 AWS 리전: {region}")
        print("="*60)
    
    def run_super_resolution(self, image_source: str, case_id: str) -> dict:
        """Super Resolution 실행"""
        print("\n🔍 Super Resolution 처리 시작")
        
        sr_processor = BedrockSuperResolution(self.region, self.bucket_name)
        results = sr_processor.process_super_resolution_pipeline(image_source, case_id)
        
        if 'final' in results:
            print(f"✅ Super Resolution 완료: {results['s3_urls']['final']}")
            return results
        else:
            print("⚠️ Super Resolution 실패, 원본 사용")
            return {'s3_urls': {'final': image_source}}
    
    def run_case1(self, image_path: str, use_sr: bool = True) -> dict:
        """케이스 1: CCTV 이미지만 있는 경우"""
        print("\n📸 Case 1: CCTV 이미지 → 특징 추출 → 몽타주 생성")
        
        # Super Resolution 적용 여부
        if use_sr:
            enhanced_image = self.run_super_resolution(image_path)
        else:
            enhanced_image = image_path
        
        # Case 1 실행
        case1_processor = EnhancedBedrockCase1(self.region)
        case1_output = os.path.join(self.base_output, "case1_montage")
        
        results = case1_processor.process_complete_pipeline(enhanced_image, case1_output)
        
        return {
            'case': 'case1',
            'input_image': image_path,
            'enhanced_image': enhanced_image if use_sr else None,
            'output_directory': case1_output,
            'results': results,
            'success': len(results) > 0
        }
    
    def run_case2(self, person_info_path: str, face_image_path: str) -> dict:
        """케이스 2: 구조화된 정보 + 얼굴 사진"""
        print("\n👤 Case 2: 인물 정보 + 얼굴 사진 → 전신 합성")
        
        case2_processor = EnhancedBedrockCase2(self.region)
        case2_output = os.path.join(self.base_output, "case2_synthesis")
        
        results = case2_processor.process_complete_pipeline(
            person_info_path, face_image_path, case2_output
        )
        
        return {
            'case': 'case2',
            'person_info': person_info_path,
            'face_image': face_image_path,
            'output_directory': case2_output,
            'results': results,
            'success': len(results) > 0
        }
    
    def run_case3(self, cctv_image: str, face_image: str = None, known_info: str = None) -> dict:
        """케이스 3: CCTV + 얼굴 사진 → 수사 보고서"""
        print("\n🔍 Case 3: CCTV + 얼굴 사진 → 수사 보고서")
        
        case3_processor = BedrockMissingPersonCase3(self.region)
        case3_output = os.path.join(self.base_output, "case3_investigation")
        
        # Super Resolution 적용
        enhanced_cctv = self.run_super_resolution(cctv_image)
        
        # Case 3 실행 (수동으로 분석 수행)
        os.makedirs(case3_output, exist_ok=True)
        
        # CCTV 상황 분석
        cctv_analysis = case3_processor.analyze_cctv_context(enhanced_cctv)
        
        # 인물 세부 분석
        person_analysis = case3_processor.analyze_person_details(enhanced_cctv)
        
        # 기존 정보와 비교
        known_data = {}
        if known_info and os.path.exists(known_info):
            with open(known_info, 'r', encoding='utf-8') as f:
                known_data = json.load(f)
        
        comparison_result = case3_processor.compare_with_known_info(
            cctv_analysis, person_analysis, known_info
        )
        
        # 수사 보고서 생성
        report_path = case3_processor.generate_investigation_report(
            cctv_analysis, person_analysis, comparison_result, face_image, case3_output
        )
        
        return {
            'case': 'case3',
            'cctv_image': cctv_image,
            'enhanced_cctv': enhanced_cctv,
            'face_image': face_image,
            'known_info': known_info,
            'output_directory': case3_output,
            'report_path': report_path,
            'success': os.path.exists(report_path) if report_path else False
        }
    
    def auto_detect_case(self, **kwargs) -> str:
        """입력 파라미터로 케이스 자동 감지"""
        has_cctv = 'cctv_image' in kwargs and kwargs['cctv_image']
        has_face = 'face_image' in kwargs and kwargs['face_image']
        has_info = 'person_info' in kwargs and kwargs['person_info']
        
        if has_info and has_face:
            return 'case2'
        elif has_cctv and has_face:
            return 'case3'
        elif has_cctv:
            return 'case1'
        else:
            return 'unknown'
    
    def generate_summary_report(self, results: list):
        """전체 실행 결과 요약 리포트"""
        summary_path = os.path.join(self.base_output, "SUMMARY_REPORT.html")
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>실종자 찾기 AI 시스템 - 실행 결과</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: auto; background: white; padding: 30px; border-radius: 10px; }}
        h1 {{ color: #2c3e50; text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 15px; }}
        .case-section {{ margin: 30px 0; padding: 20px; border-left: 5px solid #3498db; background: #f8f9fa; }}
        .success {{ border-left-color: #27ae60; }}
        .failed {{ border-left-color: #e74c3c; }}
        .file-list {{ background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 10px 0; }}
        .timestamp {{ color: #7f8c8d; font-size: 14px; text-align: center; }}
        .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }}
        .stat-box {{ background: #34495e; color: white; padding: 20px; border-radius: 10px; text-align: center; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 실종자 찾기 AI 시스템 실행 결과</h1>
        <p class="timestamp">실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="stats">
            <div class="stat-box">
                <h3>실행된 케이스</h3>
                <h2>{len(results)}</h2>
            </div>
            <div class="stat-box">
                <h3>성공한 케이스</h3>
                <h2>{sum(1 for r in results if r.get('success', False))}</h2>
            </div>
            <div class="stat-box">
                <h3>생성된 파일</h3>
                <h2>{sum(len(os.listdir(r.get('output_directory', ''))) for r in results if os.path.exists(r.get('output_directory', '')))}</h2>
            </div>
        </div>
"""
        
        for result in results:
            case_name = result.get('case', 'Unknown')
            success = result.get('success', False)
            output_dir = result.get('output_directory', '')
            
            status_class = 'success' if success else 'failed'
            status_text = '✅ 성공' if success else '❌ 실패'
            
            html_content += f"""
        <div class="case-section {status_class}">
            <h2>{case_name.upper()} - {status_text}</h2>
            
            <h3>📁 출력 디렉토리</h3>
            <p><code>{output_dir}</code></p>
            
            <h3>📄 생성된 파일들</h3>
            <div class="file-list">
"""
            
            if os.path.exists(output_dir):
                files = sorted(os.listdir(output_dir))
                for file in files:
                    html_content += f"                • {file}<br>\n"
            else:
                html_content += "                출력 디렉토리가 존재하지 않습니다.\n"
            
            html_content += """            </div>
        </div>
"""
        
        html_content += """
        <div style="text-align: center; margin-top: 40px; padding: 20px; background: #ecf0f1; border-radius: 10px;">
            <h3>🤖 사용된 AI 모델</h3>
            <p><strong>Claude 3.5 Sonnet:</strong> 이미지 분석 및 특징 추출</p>
            <p><strong>Nova Canvas:</strong> 이미지 생성 및 변환</p>
            <p><strong>Titan Image Generator v2:</strong> Super Resolution</p>
            <p><strong>SDXL:</strong> 이미지 개선 및 Inpainting</p>
        </div>
    </div>
</body>
</html>
"""
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"\n📊 전체 실행 결과 리포트: {summary_path}")
        return summary_path

def main():
    parser = argparse.ArgumentParser(
        description="AWS Bedrock 기반 실종자 찾기 AI 통합 시스템",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  # Case 1: CCTV 이미지만 있는 경우
  python run_missing_person_ai.py --case 1 --cctv-image cctv.jpg
  
  # Case 2: 인물 정보 + 얼굴 사진
  python run_missing_person_ai.py --case 2 --person-info info.json --face-image face.jpg
  
  # Case 3: CCTV + 얼굴 사진 + 기존 정보
  python run_missing_person_ai.py --case 3 --cctv-image cctv.jpg --face-image face.jpg --known-info known.json
  
  # 자동 케이스 감지
  python run_missing_person_ai.py --auto --cctv-image cctv.jpg --face-image face.jpg
  
  # Super Resolution만 실행
  python run_missing_person_ai.py --super-resolution-only low_quality.jpg
        """
    )
    
    # 기본 옵션
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전")
    parser.add_argument("--output", "-o", help="출력 디렉토리 (자동 생성)")
    parser.add_argument("--no-sr", action="store_true", help="Super Resolution 건너뛰기")
    
    # 케이스 선택
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--case", "-c", type=int, choices=[1, 2, 3], help="실행할 케이스 번호")
    group.add_argument("--auto", "-a", action="store_true", help="케이스 자동 감지")
    group.add_argument("--super-resolution-only", "-sr", metavar="IMAGE", help="Super Resolution만 실행")
    
    # 입력 파일들
    parser.add_argument("--cctv-image", help="CCTV 이미지 파일")
    parser.add_argument("--face-image", help="얼굴 참조 이미지 파일")
    parser.add_argument("--person-info", help="인물 정보 JSON 파일")
    parser.add_argument("--known-info", help="기존 알려진 정보 JSON 파일")
    
    args = parser.parse_args()
    
    # 기본 검증
    if args.super_resolution_only:
        if not os.path.exists(args.super_resolution_only):
            print(f"❌ 이미지 파일을 찾을 수 없습니다: {args.super_resolution_only}")
            return
    
    # 시스템 초기화
    orchestrator = MissingPersonAIOrchestrator(args.region)
    if args.output:
        orchestrator.base_output = args.output
    
    results = []
    
    try:
        # Super Resolution만 실행
        if args.super_resolution_only:
            print("🔍 Super Resolution 전용 실행")
            result_path = orchestrator.run_super_resolution(args.super_resolution_only)
            print(f"✅ 완료: {result_path}")
            return
        
        # 자동 케이스 감지
        if args.auto:
            case_params = {
                'cctv_image': args.cctv_image,
                'face_image': args.face_image,
                'person_info': args.person_info
            }
            detected_case = orchestrator.auto_detect_case(**case_params)
            
            if detected_case == 'unknown':
                print("❌ 제공된 파라미터로 케이스를 감지할 수 없습니다.")
                print("최소한 다음 중 하나가 필요합니다:")
                print("- CCTV 이미지 (Case 1)")
                print("- 인물 정보 + 얼굴 사진 (Case 2)")
                print("- CCTV + 얼굴 사진 (Case 3)")
                return
            
            print(f"🎯 자동 감지된 케이스: {detected_case}")
            args.case = int(detected_case[-1])  # 'case1' -> 1
        
        # 케이스별 실행
        if args.case == 1:
            if not args.cctv_image:
                print("❌ Case 1에는 --cctv-image가 필요합니다.")
                return
            if not os.path.exists(args.cctv_image):
                print(f"❌ CCTV 이미지를 찾을 수 없습니다: {args.cctv_image}")
                return
            
            result = orchestrator.run_case1(args.cctv_image, not args.no_sr)
            results.append(result)
        
        elif args.case == 2:
            if not args.person_info or not args.face_image:
                print("❌ Case 2에는 --person-info와 --face-image가 필요합니다.")
                return
            
            for file_path, name in [(args.person_info, "인물 정보"), (args.face_image, "얼굴 이미지")]:
                if not os.path.exists(file_path):
                    print(f"❌ {name} 파일을 찾을 수 없습니다: {file_path}")
                    return
            
            result = orchestrator.run_case2(args.person_info, args.face_image)
            results.append(result)
        
        elif args.case == 3:
            if not args.cctv_image:
                print("❌ Case 3에는 --cctv-image가 필요합니다.")
                return
            if not os.path.exists(args.cctv_image):
                print(f"❌ CCTV 이미지를 찾을 수 없습니다: {args.cctv_image}")
                return
            
            result = orchestrator.run_case3(args.cctv_image, args.face_image, args.known_info)
            results.append(result)
        
        # 결과 요약
        if results:
            summary_path = orchestrator.generate_summary_report(results)
            
            print("\n" + "="*60)
            print("🎉 모든 처리 완료!")
            print(f"📊 요약 리포트: {summary_path}")
            print(f"📁 전체 결과: {orchestrator.base_output}")
            print("="*60)
        
    except KeyboardInterrupt:
        print("\n⚠️ 사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()