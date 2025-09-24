"""
AWS Bedrock 기반 실종자 찾기 AI - 케이스 1 (Enhanced Version)
Nova Canvas + Titan Image Generator G1 v2 + Claude 3.5 Sonnet
"""

import boto3
import json
import base64
import os
import argparse
from PIL import Image, ImageDraw
import io
import cv2
import numpy as np
from typing import Dict, Optional, Tuple, List
from s3_utils import S3Manager, generate_case_id

class EnhancedBedrockCase1:
    def __init__(self, region_name='us-east-1', bucket_name='dasibom-ai-results'):
        """최신 Bedrock 모델들을 활용한 케이스 1: CCTV → 특징 추출 → 몽타주 생성"""
        print("🚀 AWS Bedrock Enhanced 클라이언트 초기화 중...")
        
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
        
        # S3 매니저 초기화
        self.s3_manager = S3Manager(bucket_name, region_name)
        
        # 사용 가능한 최신 모델들
        self.models = {
            'claude': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            'nova_canvas': 'amazon.nova-canvas-v1:0',
            'titan_v2': 'amazon.titan-image-generator-v2:0',
            'sdxl': 'stability.stable-diffusion-xl-v1-0'
        }
        
        print(f"✅ 리전: {region_name}")
        print(f"✅ 활성 모델들:")
        for name, id in self.models.items():
            print(f"   - {name}: {id}")
        print("초기화 완료!\n")
        
        # OpenCV 얼굴 검출기 초기화
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    def encode_image(self, image_source: str) -> str:
        """이미지를 base64로 인코딩 (S3, URL, 로컬 파일 지원)"""
        return self.s3_manager.encode_image_from_source(image_source)
    
    def decode_image(self, base64_string: str) -> Image.Image:
        """base64를 PIL Image로 디코딩"""
        image_data = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_data))
    
    def detect_and_crop_faces(self, image: Image.Image) -> List[Image.Image]:
        """얼굴 검출 및 크롭"""
        # PIL to OpenCV
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # 얼굴 검출
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        
        face_crops = []
        for (x, y, w, h) in faces:
            # 여유 공간 추가 (20%)
            padding = int(w * 0.2)
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(image.width, x + w + padding)
            y2 = min(image.height, y + h + padding)
            
            face_crop = image.crop((x1, y1, x2, y2))
            face_crops.append(face_crop)
            
        return face_crops
    
    def super_resolve_with_titan(self, image_base64: str) -> str:
        """Titan v2로 이미지 고화질 변환"""
        print("🔍 Titan v2로 Super Resolution 처리 중...")
        
        try:
            request_body = {
                "taskType": "IMAGE_VARIATION",
                "imageVariationParams": {
                    "images": [image_base64],
                    "text": "ultra high resolution, crystal clear, sharp details, enhanced quality, 4K, professional photography"
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['titan_v2'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            enhanced_image = response_body['images'][0]
            
            print("✅ Super Resolution 완료!")
            return enhanced_image
            
        except Exception as e:
            print(f"⚠️ Titan Super Resolution 실패, 원본 사용: {e}")
            return image_base64
    
    def analyze_with_claude(self, image_base64: str) -> Dict:
        """Claude 3.5 Sonnet으로 상세 인물 분석"""
        print("🧠 Claude 3.5 Sonnet으로 인물 분석 중...")
        
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": """이 CCTV 이미지의 인물을 매우 상세하게 분석해주세요. 다음 항목들을 포함해주세요:

# 얼굴 및 신체 특징
- 성별과 추정 나이
- 얼굴형과 피부톤
- 머리 스타일, 색상, 길이
- 눈, 코, 입의 특징
- 키와 체형
- 특별한 신체적 특징 (흉터, 문신 등)

# 의상 및 소지품
- 상의 (종류, 색상, 브랜드, 특징)
- 하의 (종류, 색상, 스타일)
- 신발 (종류, 색상)
- 액세서리 (시계, 안경, 목걸이 등)
- 가방이나 소지품

# 행동 및 상황
- 걸음걸이와 자세
- 표정과 감정 상태
- 이동 방향과 속도
- 주변 환경과 시간대

각 항목에 대해 가능한 한 구체적으로 설명해주세요."""
                    }
                ]
            }
        ]
        
        try:
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "messages": messages,
                "temperature": 0.1
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['claude'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            analysis = response_body['content'][0]['text']
            
            print("✅ Claude 분석 완료!")
            print("\n=== 분석 결과 (일부) ===")
            print(analysis[:500] + "...")
            
            return {
                'full_analysis': analysis,
                'success': True
            }
            
        except Exception as e:
            print(f"❌ Claude 분석 실패: {e}")
            return {'full_analysis': '', 'success': False}
    
    def generate_montage_with_nova(self, analysis: str, style: str = "realistic") -> str:
        """Nova Canvas로 몽타주 생성"""
        print("🎨 Nova Canvas로 몽타주 생성 중...")
        
        # 분석 결과를 프롬프트로 변환
        prompt = f"""Create a detailed police sketch portrait based on this description:
        {analysis[:1000]}
        
        Style: {style} portrait, professional composite sketch, clear facial features, 
        front facing, neutral expression, high detail, suitable for identification"""
        
        try:
            request_body = {
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {
                    "text": prompt
                },
                "imageGenerationConfig": {
                    "numberOfImages": 1,
                    "height": 768,
                    "width": 768,
                    "cfgScale": 8.0,
                    "seed": 42
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['nova_canvas'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            montage_image = response_body['images'][0]
            
            print("✅ Nova Canvas 몽타주 생성 완료!")
            return montage_image
            
        except Exception as e:
            print(f"⚠️ Nova Canvas 실패, SDXL로 대체: {e}")
            return self.generate_montage_with_sdxl(analysis)
    
    def generate_montage_with_sdxl(self, analysis: str) -> str:
        """SDXL로 몽타주 생성 (대체 옵션)"""
        print("🎨 SDXL로 몽타주 생성 중...")
        
        prompt = f"police sketch portrait, {analysis[:500]}, realistic, detailed face"
        
        try:
            request_body = {
                "text_prompts": [
                    {"text": prompt, "weight": 1.0},
                    {"text": "blurry, cartoon, anime", "weight": -1.0}
                ],
                "cfg_scale": 8.0,
                "steps": 50,
                "seed": 42,
                "width": 512,
                "height": 512
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['sdxl'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['artifacts'][0]['base64']
            
        except Exception as e:
            print(f"❌ SDXL 생성 실패: {e}")
            return None
    
    def enhance_face_with_nova(self, face_base64: str) -> str:
        """Nova Canvas image-to-image로 얼굴 개선"""
        print("✨ Nova Canvas로 얼굴 리파인먼트 중...")
        
        try:
            request_body = {
                "taskType": "IMAGE_VARIATION",
                "imageVariationParams": {
                    "images": [face_base64],
                    "text": "high quality portrait, clear facial features, sharp details, professional photography",
                    "similarityStrength": 0.7
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['nova_canvas'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            enhanced_face = response_body['images'][0]
            
            print("✅ 얼굴 개선 완료!")
            return enhanced_face
            
        except Exception as e:
            print(f"⚠️ Nova 얼굴 개선 실패: {e}")
            return face_base64
    
    def process_complete_pipeline(self, cctv_image_source: str, case_id: str = None) -> Dict:
        """전체 파이프라인 실행"""
        if not case_id:
            case_id = generate_case_id()
        
        results = {
            'case_id': case_id,
            'case_type': 'case1_montage',
            's3_urls': {}
        }
        
        print("\n" + "="*60)
        print("🚀 ENHANCED CASE 1 PIPELINE 시작")
        print(f"📋 케이스 ID: {case_id}")
        print("="*60 + "\n")
        
        # 1. 원본 이미지 로드
        print("📸 STEP 1: 원본 CCTV 이미지 로드")
        original_base64 = self.encode_image(cctv_image_source)
        original_image = self.decode_image(original_base64)
        results['original'] = original_image
        
        # 2. Super Resolution
        print("\n📸 STEP 2: Super Resolution 처리")
        enhanced_base64 = self.super_resolve_with_titan(original_base64)
        enhanced_image = self.decode_image(enhanced_base64)
        
        # S3에 저장
        enhanced_s3_url = self.s3_manager.upload_pil_image_to_s3(
            enhanced_image, case_id, "01_super_resolved.png", "case1_montage"
        )
        results['enhanced'] = enhanced_image
        results['s3_urls']['enhanced'] = enhanced_s3_url
        print(f"💾 S3 저장: {enhanced_s3_url}")
        
        # 3. Claude 분석
        print("\n📸 STEP 3: Claude 3.5 Sonnet 분석")
        analysis_result = self.analyze_with_claude(enhanced_base64)
        
        if analysis_result['success']:
            # 분석 결과를 S3에 저장
            analysis_content = "=== Claude 3.5 Sonnet 인물 분석 ===\n\n" + analysis_result['full_analysis']
            analysis_s3_url = self.s3_manager.upload_text_to_s3(
                analysis_content, case_id, "02_claude_analysis.txt", "case1_montage"
            )
            results['s3_urls']['analysis'] = analysis_s3_url
            print(f"💾 S3 저장: {analysis_s3_url}")
            
            # 4. 몽타주 생성
            print("\n📸 STEP 4: Nova Canvas 몽타주 생성")
            montage_base64 = self.generate_montage_with_nova(analysis_result['full_analysis'])
            
            if montage_base64:
                montage_image = self.decode_image(montage_base64)
                
                # S3에 저장
                montage_s3_url = self.s3_manager.upload_pil_image_to_s3(
                    montage_image, case_id, "03_nova_montage.png", "case1_montage"
                )
                results['montage'] = montage_image
                results['s3_urls']['montage'] = montage_s3_url
                print(f"💾 S3 저장: {montage_s3_url}")
                
                # 5. 얼굴 검출 및 크롭
                print("\n📸 STEP 5: 얼굴 검출 및 크롭")
                face_crops = self.detect_and_crop_faces(montage_image)
                
                if face_crops:
                    print(f"✅ {len(face_crops)}개 얼굴 검출됨")
                    
                    for i, face_crop in enumerate(face_crops):
                        # 얼굴을 S3에 저장
                        face_s3_url = self.s3_manager.upload_pil_image_to_s3(
                            face_crop, case_id, f"04_face_crop_{i+1}.png", "case1_montage"
                        )
                        results['s3_urls'][f'face_crop_{i+1}'] = face_s3_url
                        print(f"💾 얼굴 {i+1} S3 저장: {face_s3_url}")
                        
                        # 6. 얼굴 개선
                        print(f"\n📸 STEP 6: 얼굴 {i+1} 리파인먼트")
                        face_buffer = io.BytesIO()
                        face_crop.save(face_buffer, format='PNG')
                        face_base64 = base64.b64encode(face_buffer.getvalue()).decode()
                        
                        refined_face_base64 = self.enhance_face_with_nova(face_base64)
                        refined_face = self.decode_image(refined_face_base64)
                        
                        # 개선된 얼굴을 S3에 저장
                        refined_s3_url = self.s3_manager.upload_pil_image_to_s3(
                            refined_face, case_id, f"05_refined_face_{i+1}.png", "case1_montage"
                        )
                        results['s3_urls'][f'refined_face_{i+1}'] = refined_s3_url
                        print(f"💾 개선된 얼굴 S3 저장: {refined_s3_url}")
                        
                        results[f'refined_face_{i+1}'] = refined_face
                else:
                    print("⚠️ 얼굴이 검출되지 않았습니다")
        
        # 7. 최종 리포트 생성
        print("\n📸 STEP 7: 최종 리포트 생성")
        report_s3_url = self.generate_final_report(results, analysis_result, case_id)
        results['s3_urls']['final_report'] = report_s3_url
        
        print("\n" + "="*60)
        print("✅ ENHANCED CASE 1 PIPELINE 완료!")
        print(f"📋 케이스 ID: {case_id}")
        print(f"📁 모든 결과가 S3에 저장되었습니다")
        print("="*60 + "\n")
        
        return results
    
    def generate_final_report(self, results: Dict, analysis: Dict, case_id: str) -> str:
        """HTML 형식의 최종 리포트 생성"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>실종자 식별 리포트 - Enhanced Case 1</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f0f0f0; }}
        .container {{ max-width: 1200px; margin: auto; background: white; padding: 30px; border-radius: 10px; }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        .image-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }}
        .image-box {{ border: 1px solid #ddd; padding: 10px; border-radius: 5px; }}
        .image-box img {{ width: 100%; height: auto; }}
        .analysis {{ background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0; }}
        .timestamp {{ color: #7f8c8d; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 실종자 식별 AI 분석 리포트</h1>
        <p class="timestamp">케이스 ID: {case_id}</p>
        <p class="timestamp">생성 시간: {generate_case_id()}</p>
        
        <h2>📊 처리 단계별 결과</h2>
        <div class="image-grid">
            <div class="image-box">
                <h3>1. 원본 CCTV</h3>
                <p>초기 입력 이미지</p>
            </div>
            <div class="image-box">
                <h3>2. Super Resolution</h3>
                <p>Titan v2 고화질 변환</p>
            </div>
            <div class="image-box">
                <h3>3. 생성된 몽타주</h3>
                <p>Nova Canvas 생성</p>
            </div>
            <div class="image-box">
                <h3>4. 추출된 얼굴</h3>
                <p>OpenCV 얼굴 검출</p>
            </div>
        </div>
        
        <h2>🧠 Claude 3.5 Sonnet 분석</h2>
        <div class="analysis">
            <pre>{analysis.get('full_analysis', 'No analysis available')}</pre>
        </div>
        
        <h2>✨ 사용된 기술</h2>
        <ul>
            <li><strong>Claude 3.5 Sonnet:</strong> 인물 특징 상세 분석</li>
            <li><strong>Titan Image Generator v2:</strong> Super Resolution</li>
            <li><strong>Nova Canvas:</strong> 몽타주 생성 & 얼굴 개선</li>
            <li><strong>OpenCV:</strong> 얼굴 검출 및 크롭</li>
        </ul>
    </div>
</body>
</html>
"""
        
        # S3에 HTML 리포트 저장
        report_s3_url = self.s3_manager.upload_text_to_s3(
            html_content, case_id, "final_report.html", "case1_montage"
        )
        print(f"💾 HTML 리포트 S3 저장: {report_s3_url}")
        return report_s3_url

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock Enhanced - 케이스 1")
    parser.add_argument("image_source", help="분석할 CCTV 이미지 (S3 URL, HTTP URL, 또는 로컬 경로)")
    parser.add_argument("--case-id", "-c", help="케이스 ID (미지정시 자동 생성)")
    parser.add_argument("--bucket", "-b", default="dasibom-ai-results", help="S3 버킷명")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전")
    
    args = parser.parse_args()
    
    # Enhanced 파이프라인 실행
    processor = EnhancedBedrockCase1(region_name=args.region, bucket_name=args.bucket)
    results = processor.process_complete_pipeline(args.image_source, args.case_id)
    
    print(f"\n🎉 처리 완료!")
    print(f"📋 케이스 ID: {results['case_id']}")
    print(f"🔗 S3 결과 URL들:")
    for key, url in results['s3_urls'].items():
        print(f"  - {key}: {url}")

if __name__ == "__main__":
    main()