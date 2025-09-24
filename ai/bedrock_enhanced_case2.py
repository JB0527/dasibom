"""
AWS Bedrock 기반 실종자 찾기 AI - 케이스 2 (Enhanced Version)
텍스트 설명 + 얼굴 사진 → 전신 합성 with Face Inpainting
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

class EnhancedBedrockCase2:
    def __init__(self, region_name='us-east-1', bucket_name='dasibom-ai-results'):
        """케이스 2: 구조화된 정보 + 얼굴 사진 → 전신 생성 + 얼굴 합성"""
        print("🚀 AWS Bedrock Enhanced Case 2 초기화 중...")
        
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
        print("✅ 활성 모델: Nova Canvas, Titan v2, Claude 3.5, SDXL")
        print("초기화 완료!\n")
        
        # OpenCV 얼굴 검출기
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
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
    
    def analyze_face_features(self, face_image_path: str) -> Dict:
        """Claude로 얼굴 특징 상세 분석"""
        print("🧠 Claude 3.5로 얼굴 특징 분석 중...")
        
        face_base64 = self.encode_image(face_image_path)
        
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": face_base64
                        }
                    },
                    {
                        "type": "text",
                        "text": """이 얼굴 사진을 매우 상세하게 분석해주세요:

1. 얼굴형 (둥근형, 타원형, 각진형 등)
2. 피부톤과 색상
3. 눈 모양, 크기, 색상
4. 눈썹 모양과 굵기
5. 코 모양과 크기
6. 입술 모양과 색상
7. 턱선과 광대뼈
8. 특별한 특징 (점, 흉터, 주름 등)
9. 추정 나이와 성별
10. 전반적인 인상과 분위기

매우 구체적으로 설명해주세요."""
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
            face_description = response_body['content'][0]['text']
            
            print("✅ 얼굴 분석 완료!")
            return {
                'description': face_description,
                'success': True
            }
            
        except Exception as e:
            print(f"❌ 얼굴 분석 실패: {e}")
            return {'description': '', 'success': False}
    
    def generate_full_body_with_nova(self, person_info: Dict, face_features: str) -> str:
        """Nova Canvas로 전신 이미지 생성"""
        print("🎨 Nova Canvas로 전신 이미지 생성 중...")
        
        # 정보 결합
        gender = person_info.get('gender', 'person')
        age = person_info.get('age', '')
        height = person_info.get('height', '')
        build = person_info.get('build', '')
        clothing = person_info.get('clothing', '')
        hair = person_info.get('hair', '')
        
        prompt = f"""Full body portrait of a {gender}, {age} years old.
        
        Physical appearance: {face_features[:500]}
        Body type: {height}, {build}
        Hair: {hair}
        Clothing: {clothing}
        
        Professional photography, studio lighting, white background,
        standing straight, front view, full figure visible from head to toe,
        clear and detailed, photorealistic style."""
        
        try:
            request_body = {
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {
                    "text": prompt
                },
                "imageGenerationConfig": {
                    "numberOfImages": 1,
                    "height": 1024,
                    "width": 768,
                    "cfgScale": 8.0
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['nova_canvas'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            print("✅ 전신 이미지 생성 완료!")
            return response_body['images'][0]
            
        except Exception as e:
            print(f"⚠️ Nova Canvas 실패, Titan으로 대체: {e}")
            return self.generate_with_titan(prompt)
    
    def generate_with_titan(self, prompt: str) -> str:
        """Titan v2로 이미지 생성 (대체)"""
        try:
            request_body = {
                "taskType": "TEXT_IMAGE",
                "textToImageParams": {
                    "text": prompt
                },
                "imageGenerationConfig": {
                    "numberOfImages": 1,
                    "height": 1024,
                    "width": 768,
                    "cfgScale": 8.0
                }
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['titan_v2'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['images'][0]
            
        except Exception as e:
            print(f"❌ Titan 생성 실패: {e}")
            return None
    
    def detect_face_region(self, image: Image.Image) -> Optional[Tuple[int, int, int, int]]:
        """얼굴 영역 검출"""
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            x, y, w, h = faces[0]
            # 약간의 여백 추가
            padding = int(w * 0.1)
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image.width - x, w + 2*padding)
            h = min(image.height - y, h + 2*padding)
            return (x, y, w, h)
        return None
    
    def create_face_mask(self, image: Image.Image, face_region: Tuple[int, int, int, int]) -> Image.Image:
        """얼굴 영역 마스크 생성"""
        mask = Image.new('L', image.size, 0)
        draw = ImageDraw.Draw(mask)
        
        x, y, w, h = face_region
        # 타원형 마스크로 자연스럽게
        draw.ellipse([x, y, x+w, y+h], fill=255)
        
        # 가우시안 블러로 경계 부드럽게
        mask_np = np.array(mask)
        mask_np = cv2.GaussianBlur(mask_np, (21, 21), 10)
        
        return Image.fromarray(mask_np)
    
    def inpaint_face_with_sdxl(self, body_image: Image.Image, face_image: Image.Image, 
                               face_region: Tuple[int, int, int, int]) -> Image.Image:
        """SDXL Inpainting으로 얼굴 합성"""
        print("🔄 SDXL Inpainting으로 얼굴 합성 중...")
        
        # 마스크 생성
        mask = self.create_face_mask(body_image, face_region)
        
        # 얼굴 영역에 참조 얼굴 붙이기
        x, y, w, h = face_region
        face_resized = face_image.resize((w, h), Image.Resampling.LANCZOS)
        
        body_with_face = body_image.copy()
        body_with_face.paste(face_resized, (x, y))
        
        # Inpainting 요청
        try:
            request_body = {
                "text_prompts": [
                    {"text": "seamless face integration, natural lighting, photorealistic", "weight": 1.0},
                    {"text": "artifacts, seams, unnatural", "weight": -1.0}
                ],
                "init_image": self.encode_pil_image(body_with_face),
                "mask_image": self.encode_pil_image(mask),
                "mask_source": "MASK_IMAGE_WHITE",
                "cfg_scale": 7.0,
                "steps": 30,
                "start_schedule": 0.6
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['sdxl'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            result_base64 = response_body['artifacts'][0]['base64']
            
            print("✅ 얼굴 합성 완료!")
            return self.decode_image(result_base64)
            
        except Exception as e:
            print(f"⚠️ Inpainting 실패, 직접 합성 사용: {e}")
            return body_with_face
    
    def enhance_with_nova_variation(self, image: Image.Image) -> Image.Image:
        """Nova Canvas로 최종 이미지 개선"""
        print("✨ Nova Canvas로 최종 품질 개선 중...")
        
        try:
            request_body = {
                "taskType": "IMAGE_VARIATION",
                "imageVariationParams": {
                    "images": [self.encode_pil_image(image)],
                    "text": "professional portrait, natural face integration, high quality, clear details",
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
            enhanced_base64 = response_body['images'][0]
            
            print("✅ 최종 개선 완료!")
            return self.decode_image(enhanced_base64)
            
        except Exception as e:
            print(f"⚠️ Nova 개선 실패: {e}")
            return image
    
    def process_complete_pipeline(self, person_info_path: str, face_image_source: str, 
                                 case_id: str = None) -> Dict:
        """전체 파이프라인 실행"""
        if not case_id:
            case_id = generate_case_id()
        
        results = {
            'case_id': case_id,
            'case_type': 'case2_synthesis',
            's3_urls': {}
        }
        
        print("\n" + "="*60)
        print("🚀 ENHANCED CASE 2 PIPELINE 시작")
        print(f"📋 케이스 ID: {case_id}")
        print("="*60 + "\n")
        
        # 1. 정보 로드
        print("📋 STEP 1: 인물 정보 로드")
        with open(person_info_path, 'r', encoding='utf-8') as f:
            person_info = json.load(f)
        print(f"✅ 정보 로드 완료: {json.dumps(person_info, ensure_ascii=False, indent=2)}")
        
        # 2. 얼굴 분석
        print("\n📋 STEP 2: 얼굴 특징 분석")
        face_analysis = self.analyze_face_features(face_image_source)
        
        if not face_analysis['success']:
            print("❌얼굴 분석 실패")
            return results
        
        # 분석 결과를 S3에 저장
        analysis_content = "=== 얼굴 특징 분석 ===\n\n" + face_analysis['description']
        analysis_s3_url = self.s3_manager.upload_text_to_s3(
            analysis_content, case_id, "01_face_analysis.txt", "case2_synthesis"
        )
        results['s3_urls']['face_analysis'] = analysis_s3_url
        print(f"💾 S3 저장: {analysis_s3_url}")
        
        # 3. 전신 이미지 생성
        print("\n📋 STEP 3: 전신 이미지 생성")
        body_base64 = self.generate_full_body_with_nova(person_info, face_analysis['description'])
        
        if not body_base64:
            print("❌ 전신 생성 실패")
            return {}
        
        body_image = self.decode_image(body_base64)
        
        # S3에 저장
        body_s3_url = self.s3_manager.upload_pil_image_to_s3(
            body_image, case_id, "02_generated_body.png", "case2_synthesis"
        )
        results['s3_urls']['generated_body'] = body_s3_url
        print(f"💾 S3 저장: {body_s3_url}")
        
        # 4. 얼굴 영역 검출
        print("\n📋 STEP 4: 얼굴 영역 검출")
        face_region = self.detect_face_region(body_image)
        
        if face_region:
            print(f"✅ 얼굴 영역 검출: {face_region}")
            
            # 5. 얼굴 합성
            print("\n📋 STEP 5: 얼굴 합성 (Inpainting)")
            face_image_bytes = self.s3_manager.download_image_from_source(face_image_source)
            face_image = Image.open(io.BytesIO(face_image_bytes))
            
            composite_image = self.inpaint_face_with_sdxl(body_image, face_image, face_region)
            
            # S3에 저장
            composite_s3_url = self.s3_manager.upload_pil_image_to_s3(
                composite_image, case_id, "03_face_composite.png", "case2_synthesis"
            )
            results['s3_urls']['face_composite'] = composite_s3_url
            print(f"💾 S3 저장: {composite_s3_url}")
            
            # 6. 최종 개선
            print("\n📋 STEP 6: 최종 품질 개선")
            final_image = self.enhance_with_nova_variation(composite_image)
            
            # S3에 저장
            final_s3_url = self.s3_manager.upload_pil_image_to_s3(
                final_image, case_id, "04_final_enhanced.png", "case2_synthesis"
            )
            results['s3_urls']['final_enhanced'] = final_s3_url
            print(f"💾 S3 저장: {final_s3_url}")
            
            # 7. 비교 이미지 생성
            print("\n📋 STEP 7: 비교 이미지 생성")
            comparison_s3_url = self.create_comparison_image(face_image, body_image, composite_image, 
                                        final_image, case_id)
            results['s3_urls']['comparison'] = comparison_s3_url
        else:
            print("⚠️ 얼굴 영역을 찾을 수 없어 직접 배치")
            final_image = body_image
        
        print("\n" + "="*60)
        print("✅ ENHANCED CASE 2 PIPELINE 완료!")
        print(f"📋 케이스 ID: {case_id}")
        print(f"📁 모든 결과가 S3에 저장되었습니다")
        print("="*60 + "\n")
        
        results.update({
            'body': body_image,
            'final': final_image if 'final_image' in locals() else body_image,
            'face_analysis': face_analysis
        })
        
        return results
    
    def create_comparison_image(self, face: Image.Image, body: Image.Image, 
                                composite: Image.Image, final: Image.Image, case_id: str) -> str:
        """비교 이미지 생성"""
        # 모든 이미지를 동일 높이로 리사이즈
        height = 600
        
        face_resized = face.resize((int(face.width * height / face.height), height))
        body_resized = body.resize((int(body.width * height / body.height), height))
        composite_resized = composite.resize((int(composite.width * height / composite.height), height))
        final_resized = final.resize((int(final.width * height / final.height), height))
        
        # 가로로 연결
        total_width = face_resized.width + body_resized.width + composite_resized.width + final_resized.width
        comparison = Image.new('RGB', (total_width, height), 'white')
        
        x = 0
        for img in [face_resized, body_resized, composite_resized, final_resized]:
            comparison.paste(img, (x, 0))
            x += img.width
        
        # S3에 저장
        comparison_s3_url = self.s3_manager.upload_pil_image_to_s3(
            comparison, case_id, "05_comparison.png", "case2_synthesis"
        )
        print(f"💾 비교 이미지 S3 저장: {comparison_s3_url}")
        return comparison_s3_url

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock Enhanced - 케이스 2")
    parser.add_argument("-i", "--info", required=True, help="인물 정보 JSON 파일 (로컬 경로)")
    parser.add_argument("-f", "--face", required=True, help="얼굴 참조 사진 (S3 URL, HTTP URL, 또는 로컬 경로)")
    parser.add_argument("--case-id", "-c", help="케이스 ID (미지정시 자동 생성)")
    parser.add_argument("--bucket", "-b", default="dasibom-ai-results", help="S3 버킷명")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.info):
        print(f"❌ 정보 파일을 찾을 수 없습니다: {args.info}")
        return
    
    # Enhanced 파이프라인 실행
    processor = EnhancedBedrockCase2(region_name=args.region, bucket_name=args.bucket)
    results = processor.process_complete_pipeline(args.info, args.face, args.case_id)
    
    print(f"\n🎉 처리 완료!")
    print(f"📋 케이스 ID: {results['case_id']}")
    print(f"🔗 S3 결과 URL들:")
    for key, url in results['s3_urls'].items():
        print(f"  - {key}: {url}")

if __name__ == "__main__":
    main()