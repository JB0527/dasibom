"""
AWS Bedrock 기반 Super Resolution 파이프라인
저화질 CCTV 이미지를 고화질로 변환하는 다단계 처리
"""

import boto3
import json
import base64
import os
import argparse
from PIL import Image, ImageEnhance, ImageFilter
import io
import cv2
import numpy as np
from typing import Dict, Optional, Tuple, List
from s3_utils import S3Manager, generate_case_id

class BedrockSuperResolution:
    def __init__(self, region_name='us-east-1', bucket_name='dasibom-ai-results'):
        """Bedrock 기반 Super Resolution 시스템"""
        print("🚀 AWS Bedrock Super Resolution 초기화 중...")
        
        # EC2 IAM 역할로 Bedrock 클라이언트 초기화
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
        
        # 인증 확인
        try:
            sts = boto3.client('sts', region_name=region_name)
            identity = sts.get_caller_identity()
            arn = identity.get('Arn', '')
            if ':assumed-role/' in arn:
                print(f"✅ Bedrock 클라이언트 EC2 IAM 역할로 초기화: {arn.split('/')[-2]}")
            else:
                print(f"✅ Bedrock 클라이언트 초기화 완료")
        except Exception as e:
            print(f"⚠️ 인증 확인 실패, 계속 진행: {e}")
        
        # S3 매니저 초기화
        self.s3_manager = S3Manager(bucket_name, region_name)
        
        self.models = {
            'claude': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            'nova_canvas': 'amazon.nova-canvas-v1:0',
            'titan_v2': 'amazon.titan-image-generator-v2:0',
            'sdxl': 'stability.stable-diffusion-xl-v1-0'
        }
        
        print(f"✅ 리전: {region_name}")
        print("✅ Super Resolution 모델: Nova Canvas, Titan v2, SDXL")
        print("초기화 완료!\n")
    
    def encode_image(self, image_source: str) -> str:
        """이미지를 base64로 인코딩 (S3, URL, 로컬 파일 지원)"""
        return self.s3_manager.encode_image_from_source(image_source)
    
    def encode_pil_image(self, image: Image.Image) -> str:
        """PIL 이미지를 base64로 인코딩"""
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    def decode_image(self, base64_string: str) -> Image.Image:
        """base64를 PIL Image로 디코딩"""
        image_data = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_data))
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """전처리: 노이즈 제거 및 기본 개선"""
        print("🔧 이미지 전처리 중...")
        
        # PIL to OpenCV
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # 1. 가우시안 노이즈 제거
        denoised = cv2.GaussianBlur(cv_image, (3, 3), 0)
        
        # 2. 샤프닝 필터
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # 3. 대비 개선 (CLAHE)
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # OpenCV to PIL
        result = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
        preprocessed = Image.fromarray(result)
        
        print("✅ 전처리 완료")
        return preprocessed
    
    def analyze_image_quality(self, image_base64: str) -> Dict:
        """Claude로 이미지 품질 분석"""
        print("🧠 Claude로 이미지 품질 분석 중...")
        
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
                        "text": """이 이미지의 품질을 분석하고 개선 방향을 제안해주세요:

1. 현재 화질 상태 (해상도, 선명도, 노이즈 등)
2. 주요 문제점 (흐림, 노이즈, 압축 아티팩트 등)
3. 개선이 필요한 영역
4. 이미지에서 중요한 부분 (얼굴, 텍스트, 객체 등)
5. Super Resolution에 적합한 기법 추천

구체적이고 기술적으로 설명해주세요."""
                    }
                ]
            }
        ]
        
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['claude'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1500,
                    "messages": messages,
                    "temperature": 0.1
                })
            )
            
            response_body = json.loads(response['body'].read())
            analysis = response_body['content'][0]['text']
            
            print("✅ 품질 분석 완료!")
            return {
                'analysis': analysis,
                'success': True
            }
            
        except Exception as e:
            print(f"⚠️ 품질 분석 실패: {e}")
            return {'analysis': '', 'success': False}
    
    def upscale_with_nova_canvas(self, image_base64: str, scale_factor: int = 2) -> str:
        """Nova Canvas로 업스케일링"""
        print(f"🎨 Nova Canvas로 {scale_factor}x 업스케일링 중...")
        
        prompt = f"""Ultra high resolution enhancement, {scale_factor}x upscaling, 
        crystal clear details, sharp focus, noise reduction, 
        professional photo restoration, enhanced clarity, 
        preserve original content, improve definition"""
        
        try:
            request_body = {
                "taskType": "IMAGE_VARIATION",
                "imageVariationParams": {
                    "images": [image_base64],
                    "text": prompt,
                    "similarityStrength": 0.8
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['nova_canvas'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            print("✅ Nova Canvas 업스케일링 완료!")
            return response_body['images'][0]
            
        except Exception as e:
            print(f"⚠️ Nova Canvas 실패: {e}")
            return None
    
    def upscale_with_titan(self, image_base64: str) -> str:
        """Titan v2로 업스케일링"""
        print("🔍 Titan v2로 고화질 변환 중...")
        
        try:
            request_body = {
                "taskType": "IMAGE_VARIATION",
                "imageVariationParams": {
                    "images": [image_base64],
                    "text": "4K ultra high definition, crystal clear, super sharp, enhanced details, professional quality"
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['titan_v2'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            print("✅ Titan 업스케일링 완료!")
            return response_body['images'][0]
            
        except Exception as e:
            print(f"⚠️ Titan 실패: {e}")
            return None
    
    def enhance_with_sdxl(self, image_base64: str) -> str:
        """SDXL로 이미지 개선"""
        print("✨ SDXL로 최종 개선 중...")
        
        try:
            request_body = {
                "text_prompts": [
                    {"text": "ultra high quality, sharp focus, clear details, professional photography", "weight": 1.0},
                    {"text": "blurry, low quality, noise, artifacts, distorted", "weight": -1.0}
                ],
                "init_image": image_base64,
                "image_strength": 0.3,
                "cfg_scale": 7.0,
                "steps": 30
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['sdxl'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            print("✅ SDXL 개선 완료!")
            return response_body['artifacts'][0]['base64']
            
        except Exception as e:
            print(f"⚠️ SDXL 실패: {e}")
            return None
    
    def bicubic_upscale(self, image: Image.Image, scale: int = 2) -> Image.Image:
        """전통적인 Bicubic 업스케일링 (비교용)"""
        print(f"📐 Bicubic {scale}x 업스케일링 중...")
        
        new_width = image.width * scale
        new_height = image.height * scale
        
        upscaled = image.resize((new_width, new_height), Image.Resampling.BICUBIC)
        
        # 샤프닝 적용
        enhancer = ImageEnhance.Sharpness(upscaled)
        sharpened = enhancer.enhance(1.2)
        
        print("✅ Bicubic 업스케일링 완료!")
        return sharpened
    
    def create_comparison_grid(self, images: List[Tuple[str, Image.Image]], output_path: str):
        """비교 그리드 이미지 생성"""
        print("📊 비교 그리드 생성 중...")
        
        # 모든 이미지를 동일한 크기로 조정
        max_width = max(img.width for _, img in images)
        max_height = max(img.height for _, img in images)
        
        # 2x2 그리드로 배치
        grid_width = max_width * 2
        grid_height = max_height * 2
        
        comparison = Image.new('RGB', (grid_width, grid_height), 'white')
        
        positions = [(0, 0), (max_width, 0), (0, max_height), (max_width, max_height)]
        
        for i, (name, img) in enumerate(images[:4]):
            if i < len(positions):
                # 이미지 리사이즈
                img_resized = img.resize((max_width, max_height), Image.Resampling.LANCZOS)
                comparison.paste(img_resized, positions[i])
        
        comparison.save(output_path)
        print(f"💾 비교 그리드 저장: {output_path}")
    
    def process_super_resolution_pipeline(self, input_image_source: str, 
                                         case_id: str = None) -> Dict:
        """전체 Super Resolution 파이프라인"""
        if not case_id:
            case_id = generate_case_id()
        
        print("\n" + "="*60)
        print("🚀 SUPER RESOLUTION PIPELINE 시작")
        print(f"📋 케이스 ID: {case_id}")
        print("="*60 + "\n")
        
        results = {
            'case_id': case_id,
            'case_type': 'super_resolution',
            's3_urls': {}
        }
        
        # 1. 원본 이미지 로드
        print("📸 STEP 1: 원본 이미지 로드")
        original_image_bytes = self.s3_manager.download_image_from_source(input_image_source)
        original_image = Image.open(io.BytesIO(original_image_bytes))
        
        # S3에 저장
        original_s3_url = self.s3_manager.upload_pil_image_to_s3(
            original_image, case_id, "01_original.png", "super_resolution"
        )
        results['original'] = original_image
        results['s3_urls']['original'] = original_s3_url
        print(f"💾 S3 저장: {original_s3_url}")
        
        # 2. 전처리
        print("\n📸 STEP 2: 이미지 전처리")
        preprocessed = self.preprocess_image(original_image)
        
        # S3에 저장
        preprocessed_s3_url = self.s3_manager.upload_pil_image_to_s3(
            preprocessed, case_id, "02_preprocessed.png", "super_resolution"
        )
        results['preprocessed'] = preprocessed
        results['s3_urls']['preprocessed'] = preprocessed_s3_url
        print(f"💾 S3 저장: {preprocessed_s3_url}")
        
        # 3. 품질 분석
        print("\n📸 STEP 3: Claude 품질 분석")
        preprocessed_base64 = self.encode_pil_image(preprocessed)
        quality_analysis = self.analyze_image_quality(preprocessed_base64)
        
        if quality_analysis['success']:
            analysis_path = os.path.join(output_dir, "03_quality_analysis.txt")
            with open(analysis_path, 'w', encoding='utf-8') as f:
                f.write("=== 이미지 품질 분석 ===\n\n")
                f.write(quality_analysis['analysis'])
            print(f"💾 저장: {analysis_path}")
        
        # 4. Nova Canvas 업스케일링
        print("\n📸 STEP 4: Nova Canvas 업스케일링")
        nova_result = self.upscale_with_nova_canvas(preprocessed_base64, 2)
        if nova_result:
            nova_image = self.decode_image(nova_result)
            nova_path = os.path.join(output_dir, "04_nova_upscaled.png")
            nova_image.save(nova_path)
            results['nova'] = nova_image
            print(f"💾 저장: {nova_path}")
        
        # 5. Titan 업스케일링
        print("\n📸 STEP 5: Titan v2 업스케일링")
        titan_result = self.upscale_with_titan(preprocessed_base64)
        if titan_result:
            titan_image = self.decode_image(titan_result)
            titan_path = os.path.join(output_dir, "05_titan_upscaled.png")
            titan_image.save(titan_path)
            results['titan'] = titan_image
            print(f"💾 저장: {titan_path}")
        
        # 6. SDXL 개선
        print("\n📸 STEP 6: SDXL 최종 개선")
        best_image = nova_image if 'nova_image' in locals() else preprocessed
        best_base64 = self.encode_pil_image(best_image)
        sdxl_result = self.enhance_with_sdxl(best_base64)
        if sdxl_result:
            sdxl_image = self.decode_image(sdxl_result)
            sdxl_path = os.path.join(output_dir, "06_sdxl_enhanced.png")
            sdxl_image.save(sdxl_path)
            results['sdxl'] = sdxl_image
            print(f"💾 저장: {sdxl_path}")
        
        # 7. 전통적 방법 비교
        print("\n📸 STEP 7: Bicubic 업스케일링 (비교용)")
        bicubic_image = self.bicubic_upscale(preprocessed, 2)
        bicubic_path = os.path.join(output_dir, "07_bicubic_upscaled.png")
        bicubic_image.save(bicubic_path)
        results['bicubic'] = bicubic_image
        print(f"💾 저장: {bicubic_path}")
        
        # 8. 비교 그리드 생성
        print("\n📸 STEP 8: 결과 비교 그리드 생성")
        comparison_images = [
            ("Original", original_image),
            ("Nova Canvas", results.get('nova', preprocessed)),
            ("Titan v2", results.get('titan', preprocessed)),
            ("SDXL Enhanced", results.get('sdxl', preprocessed))
        ]
        
        comparison_path = os.path.join(output_dir, "08_comparison_grid.png")
        self.create_comparison_grid(comparison_images, comparison_path)
        
        # 9. 최종 선택
        final_image = results.get('sdxl', results.get('nova', results.get('titan', preprocessed)))
        
        # S3에 저장
        final_s3_url = self.s3_manager.upload_pil_image_to_s3(
            final_image, case_id, "09_final_result.png", "super_resolution"
        )
        results['final'] = final_image
        results['s3_urls']['final'] = final_s3_url
        print(f"💾 최종 결과 S3 저장: {final_s3_url}")
        
        print("\n" + "="*60)
        print("✅ SUPER RESOLUTION PIPELINE 완료!")
        print(f"📋 케이스 ID: {case_id}")
        print(f"📁 모든 결과가 S3에 저장되었습니다")
        print("="*60 + "\n")
        
        return results

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock Super Resolution")
    parser.add_argument("image_source", help="처리할 저화질 이미지 (S3 URL, HTTP URL, 또는 로컬 경로)")
    parser.add_argument("--case-id", "-c", help="케이스 ID (미지정시 자동 생성)")
    parser.add_argument("--bucket", "-b", default="dasibom-ai-results", help="S3 버킷명")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전")
    
    args = parser.parse_args()
    
    # Super Resolution 파이프라인 실행
    processor = BedrockSuperResolution(region_name=args.region, bucket_name=args.bucket)
    results = processor.process_super_resolution_pipeline(args.image_source, args.case_id)
    
    print(f"\n🎉 처리 완료!")
    print(f"📋 케이스 ID: {results['case_id']}")
    print(f"🏆 최종 결과: {results['s3_urls']['final']}")
    print(f"🔗 S3 결과 URL들:")
    for key, url in results['s3_urls'].items():
        print(f"  - {key}: {url}")

if __name__ == "__main__":
    main()