"""
AWS Bedrock 기반 실종자 찾기 AI - 케이스 1 (Enhanced Version)
Nova Canvas + Titan Image Generator G1 v2 + Claude 3.5 Sonnet
"""

import boto3
import json
import base64
import os
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
import cv2
import numpy as np
from typing import Dict, Optional, Tuple, List
from datetime import datetime
import textwrap
from s3_utils import S3Manager, generate_case_id

class EnhancedBedrockCase1:
    def __init__(self, region_name='us-east-1', bucket_name='seoul-ht-06-dasibom'):
        """최신 Bedrock 모델들을 활용한 케이스 1: CCTV → 특징 추출 → 몽타주 생성"""
        print("🚀 AWS Bedrock Enhanced 클라이언트 초기화 중...")
        
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
        
        # 사용 가능한 최신 모델들
        self.models = {
            'claude': os.getenv('CLAUDE_MODEL_ID', 'anthropic.claude-opus-4-1-20250805-v1:0'),
            'claude_fallback': os.getenv('CLAUDE_FALLBACK_MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0'),
            'nova_canvas': os.getenv('NOVA_CANVAS_MODEL_ID', 'amazon.nova-canvas-v1:0'),
            'titan_v2': os.getenv('TITAN_IMAGE_MODEL_ID', 'amazon.titan-image-generator-v2:0'),
            'sdxl': os.getenv('SDXL_MODEL_ID', 'stability.stable-diffusion-xl-v1')
        }
        
        print(f"✅ 리전: {region_name}")
        print(f"✅ 활성 모델들:")
        for name, id in self.models.items():
            print(f"   - {name}: {id}")
        print("초기화 완료!\n")
        
        # OpenCV 얼굴 검출기 초기화
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    def resolve_image_sources(self, image_source: str) -> List[str]:
        """단일 경로나 prefix를 받아 실제 이미지 경로 리스트로 변환"""
        if isinstance(image_source, list):
            return image_source

        if image_source.startswith('s3://'):
            lowered = image_source.lower()
            if lowered.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                return [image_source]
            return self.s3_manager.list_images_in_prefix(image_source)

        if os.path.isdir(image_source):
            collected = []
            for root, _, files in os.walk(image_source):
                for file in files:
                    lower = file.lower()
                    if lower.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                        collected.append(os.path.join(root, file))
            collected.sort()
            print(f"✅ 로컬 폴더 '{image_source}'에서 {len(collected)}개 이미지 발견")
            return collected

        return [image_source]

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

        enhanced_image = image_base64

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
            print("✅ Titan 단계 완료!")
        except Exception as e:
            print(f"⚠️ Titan Super Resolution 실패, 원본 유지: {e}")

        # Nova Canvas로 추가 리파인먼트
        try:
            return self.refine_with_nova_variation(enhanced_image)
        except Exception as e:
            print(f"⚠️ Nova 고도화 실패, Titan 결과 사용: {e}")
            return enhanced_image

    def refine_with_nova_variation(self, image_base64: str, strength: float = 0.6) -> str:
        """Nova Canvas Variation으로 고도화"""
        print("✨ Nova Canvas로 추가 고도화 중...")

        request_body = {
            "taskType": "IMAGE_VARIATION",
            "imageVariationParams": {
                "images": [image_base64],
                "text": "extremely detailed surveillance enhancement, noise reduction, photorealistic, sharp focus",
                "similarityStrength": strength
            }
        }

        response = self.bedrock_runtime.invoke_model(
            modelId=self.models['nova_canvas'],
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body)
        )

        response_body = json.loads(response['body'].read())
        refined_image = response_body['images'][0]
        print("✅ Nova 고도화 완료!")
        return refined_image
    
    def _invoke_claude(self, payload: Dict) -> Tuple[Dict, str]:
        """Claude 호출 (Opus → Fallback 순)"""
        attempted = set()
        last_error = None

        for key in ['claude', 'claude_fallback']:
            model_id = self.models.get(key)
            if not model_id or model_id in attempted:
                continue
            try:
                response = self.bedrock_runtime.invoke_model(
                    modelId=model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(payload)
                )
                return response, model_id
            except Exception as e:
                print(f"⚠️ Claude 모델 호출 실패 ({model_id}): {e}")
                last_error = e
                attempted.add(model_id)

        raise last_error if last_error else RuntimeError("Claude 모델 호출 실패")

    def analyze_with_claude(self, image_base64: str, image_index: int = 1) -> Dict:
        """Claude 3.5 Sonnet으로 상세 인물 분석"""
        print(f"🧠 Claude Opus로 인물 분석 중... (이미지 {image_index})")

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

            response, model_id = self._invoke_claude(request_body)
            response_body = json.loads(response['body'].read())
            analysis = response_body['content'][0]['text']

            print(f"✅ Claude 분석 완료! (model: {model_id})")
            print("\n=== 분석 결과 (일부) ===")
            print(analysis[:500] + "...")

            return {
                'full_analysis': analysis,
                'success': True
            }

        except Exception as e:
            print(f"❌ Claude 분석 실패: {e}")
            return {'full_analysis': '', 'success': False}

    def summarize_analyses_with_claude(self, analyses: List[str]) -> str:
        """여러 이미지 분석을 통합 요약"""
        if not analyses:
            return ''

        print("🧠 Claude Opus로 분석 요약 생성 중...")

        summary_prompt = "\n\n".join(analyses)
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """다음은 여러 CCTV 프레임에 대한 상세 분석 노트입니다. 
각 노트의 공통점과 차이점을 종합하여, 실종자를 식별하는 데 도움이 되는 핵심 특징을 항목별 bullet 형태로 요약해주세요.

요약에는 다음을 포함해주세요:
- 공통된 외모 특징 (얼굴, 헤어, 체형)
- 의상 및 소지품의 일관된 특징
- 행동/자세/동선 관련 패턴
- 프레임별로 차이가 있거나 주목해야 할 관찰 포인트
- 추가 조사 시 확인하면 좋은 사항 3가지
"""
                    },
                    {
                        "type": "text",
                        "text": summary_prompt
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

            response, model_id = self._invoke_claude(request_body)
            response_body = json.loads(response['body'].read())
            summary = response_body['content'][0]['text']
            print(f"✅ 요약 생성 완료 (model: {model_id})")
            return summary
        except Exception as e:
            print(f"⚠️ Claude 요약 생성 실패: {e}")
            return ''
    
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
        """SDXL로 몽타주 생성 (고품질 1024x1024)"""
        print("🎨 Stable Diffusion XL로 몽타주 생성 중...")

        prompt = f"professional police sketch portrait, detailed facial features based on: {analysis[:800]}, photorealistic, high quality, sharp focus, clear details, front facing view, neutral expression"

        try:
            request_body = {
                "text_prompts": [
                    {"text": prompt, "weight": 1.0},
                    {"text": "blurry, cartoon, anime, low quality, distorted, artifacts", "weight": -1.0}
                ],
                "cfg_scale": 8.0,
                "steps": 50,
                "seed": 42,
                "width": 1024,
                "height": 1024
            }

            response = self.bedrock_runtime.invoke_model(
                modelId=self.models['sdxl'],
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )

            response_body = json.loads(response['body'].read())
            print("✅ SDXL 몽타주 생성 완료!")
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
    
    def process_complete_pipeline(self, cctv_image_source: str, case_id: str = None, montage_style: str = "hyperrealistic photograph") -> Dict:
        """전체 파이프라인 실행 (여러 입력 이미지 지원)"""
        if not case_id:
            case_id = generate_case_id()

        results = {
            'case_id': case_id,
            'case_type': 'case1_montage',
            's3_urls': {},
            'frames': []
        }

        print("\n" + "="*60)
        print("🚀 ENHANCED CASE 1 PIPELINE 시작")
        print(f"📋 케이스 ID: {case_id}")
        print("="*60 + "\n")

        image_list = self.resolve_image_sources(cctv_image_source)

        if not image_list:
            print("❌ 처리할 이미지가 없습니다")
            return results

        analyses: List[str] = []

        for idx, image_path in enumerate(image_list, start=1):
            print("📸 STEP 1: 원본 CCTV 이미지 로드")
            print(f"   └ 원본 경로[{idx}]: {image_path}")
            original_base64 = self.encode_image(image_path)
            original_image = self.decode_image(original_base64)

            print("\n📸 STEP 2: Super Resolution 처리")
            enhanced_base64 = self.super_resolve_with_titan(original_base64)
            enhanced_image = self.decode_image(enhanced_base64)

            index_tag = str(idx).zfill(2)
            enhanced_filename = f"01_super_resolved_{index_tag}.png"
            enhanced_s3_url = self.s3_manager.upload_pil_image_to_s3(
                enhanced_image, case_id, enhanced_filename, "case1_montage"
            )
            results['s3_urls'][f'enhanced_{index_tag}'] = enhanced_s3_url
            print(f"💾 S3 저장: {enhanced_s3_url}")

            print("\n📸 STEP 3: Claude 사람 분석")
            analysis_result = self.analyze_with_claude(enhanced_base64, image_index=idx)
            frame_entry = {
                'index': idx,
                'source': image_path,
                'original': original_image,
                'original_base64': original_base64,
                'enhanced': enhanced_image,
                'enhanced_base64': enhanced_base64,
                'analysis': analysis_result.get('full_analysis', '')
            }

            if analysis_result['success']:
                analyses.append(f"[이미지 {idx} 분석]\n" + analysis_result['full_analysis'])

            results['frames'].append(frame_entry)

        aggregated_analysis = ''
        if analyses:
            aggregated_analysis = self.summarize_analyses_with_claude(analyses)
            combined_text = "\n\n".join(analyses)
            analysis_content = "=== Claude Opus 상세 분석 (개별) ===\n\n" + combined_text
            if aggregated_analysis:
                analysis_content += "\n\n=== 통합 요약 ===\n\n" + aggregated_analysis
            analysis_s3_url = self.s3_manager.upload_text_to_s3(
                analysis_content, case_id, "02_claude_analysis.txt", "case1_montage"
            )
            results['s3_urls']['analysis'] = analysis_s3_url
            print(f"💾 분석 결과 S3 저장: {analysis_s3_url}")
        else:
            print("⚠️ Claude 분석에 실패하여 요약을 생성하지 못했습니다")

        # 4. 몽타주 생성
        montage_prompt = aggregated_analysis if aggregated_analysis else '\n\n'.join(analyses)
        if montage_prompt:
            print("\n📸 STEP 4: Nova Canvas 몽타주 생성")
            montage_base64 = self.generate_montage_with_nova(montage_prompt, style=montage_style)

            if montage_base64:
                montage_image = self.decode_image(montage_base64)

                montage_s3_url = self.s3_manager.upload_pil_image_to_s3(
                    montage_image, case_id, "03_nova_montage.png", "case1_montage"
                )
                results['montage'] = montage_image
                results['s3_urls']['montage'] = montage_s3_url
                print(f"💾 몽타주 S3 저장: {montage_s3_url}")

                print("\n📸 STEP 5: 얼굴 검출 및 크롭")
                face_crops = self.detect_and_crop_faces(montage_image)

                if face_crops:
                    print(f"✅ {len(face_crops)}개 얼굴 검출됨")

                    for i, face_crop in enumerate(face_crops):
                        face_idx = str(i + 1).zfill(2)
                        face_s3_url = self.s3_manager.upload_pil_image_to_s3(
                            face_crop, case_id, f"04_face_crop_{face_idx}.png", "case1_montage"
                        )
                        results['s3_urls'][f'face_crop_{face_idx}'] = face_s3_url
                        print(f"💾 얼굴 {face_idx} S3 저장: {face_s3_url}")

                        print(f"\n📸 STEP 6: 얼굴 {face_idx} 리파인먼트")
                        face_buffer = io.BytesIO()
                        face_crop.save(face_buffer, format='PNG')
                        face_base64 = base64.b64encode(face_buffer.getvalue()).decode()

                        refined_face_base64 = self.enhance_face_with_nova(face_base64)
                        refined_face = self.decode_image(refined_face_base64)

                        refined_s3_url = self.s3_manager.upload_pil_image_to_s3(
                            refined_face, case_id, f"05_refined_face_{face_idx}.png", "case1_montage"
                        )
                        results['s3_urls'][f'refined_face_{face_idx}'] = refined_s3_url
                        print(f"💾 개선된 얼굴 S3 저장: {refined_s3_url}")

                        results[f'refined_face_{face_idx}'] = refined_face
                else:
                    print("⚠️ 몽타주에서 얼굴을 검출하지 못했습니다")
        else:
            print("⚠️ 몽타주 생성을 위한 분석 텍스트가 없습니다")

        # 7. 최종 리포트 생성
        print("\n📸 STEP 7: 최종 리포트 생성")
        report_s3_url, preview_s3_url = self.generate_final_report(results, {
            'full_analysis': aggregated_analysis,
            'success': bool(aggregated_analysis)
        }, case_id)
        results['s3_urls']['final_report'] = report_s3_url
        if preview_s3_url:
            results['s3_urls']['final_report_preview'] = preview_s3_url

        print("\n" + "="*60)
        print("✅ ENHANCED CASE 1 PIPELINE 완료!")
        print(f"📋 케이스 ID: {case_id}")
        print(f"📁 모든 결과가 S3에 저장되었습니다")
        print("="*60 + "\n")
        
        return results
    
    def generate_final_report(self, results: Dict, analysis: Dict, case_id: str) -> Tuple[str, Optional[str]]:
        """HTML과 요약 이미지를 생성하여 S3에 업로드"""
        frames: List[Dict] = results.get('frames', [])

        def image_to_data_uri(image: Image.Image) -> str:
            buffer = io.BytesIO()
            image.convert('RGB').save(buffer, format='JPEG', quality=90)
            return base64.b64encode(buffer.getvalue()).decode()

        frame_sections = []
        for frame in frames:
            idx = frame['index']
            original_uri = image_to_data_uri(frame['original'])
            enhanced_uri = image_to_data_uri(frame['enhanced'])
            section = f"""
            <div class=\"frame-section\">
                <h3>프레임 {idx}</h3>
                <div class=\"frame-images\">
                    <div>
                        <p>원본</p>
                        <img src=\"data:image/jpeg;base64,{original_uri}\" alt=\"original_{idx}\"/>
                    </div>
                    <div>
                        <p>향상 결과</p>
                        <img src=\"data:image/jpeg;base64,{enhanced_uri}\" alt=\"enhanced_{idx}\"/>
                    </div>
                </div>
                <pre>{frame.get('analysis', '').strip()}</pre>
            </div>
            """
            frame_sections.append(section)

        montage_section = ""
        if 'montage' in results:
            montage_uri = image_to_data_uri(results['montage'])
            montage_section = f"""
            <h2>🎨 통합 몽타주</h2>
            <img class=\"montage\" src=\"data:image/jpeg;base64,{montage_uri}\" alt=\"montage\"/>
            """

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset=\"UTF-8\">
    <title>실종자 식별 리포트 - Enhanced Case 1</title>
    <style>
        body {{ font-family: 'Noto Sans KR', Arial, sans-serif; margin: 0; background: #f4f6f8; color: #2c3e50; }}
        .container {{ max-width: 1280px; margin: 0 auto; padding: 32px; background: white; box-shadow: 0 12px 30px rgba(0,0,0,0.08); }}
        h1 {{ border-bottom: 4px solid #4c7cf3; padding-bottom: 12px; }}
        h2 {{ margin-top: 40px; color: #34495e; }}
        .meta {{ color: #7f8c8d; font-size: 14px; margin-bottom: 24px; }}
        .frame-section {{ border: 1px solid #e0e6ed; border-radius: 12px; padding: 20px; margin-bottom: 24px; background: #fbfdff; }}
        .frame-images {{ display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }}
        .frame-images div {{ flex: 1 1 320px; }}
        .frame-images img {{ width: 100%; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }}
        pre {{ background: #f7f9fc; padding: 16px; border-radius: 8px; white-space: pre-wrap; line-height: 1.48; }}
        .montage {{ width: 100%; max-width: 640px; display: block; margin: 16px auto; border-radius: 12px; box-shadow: 0 12px 24px rgba(0,0,0,0.16); }}
        .tech-list li {{ margin-bottom: 6px; }}
    </style>
</head>
<body>
    <div class=\"container\">
        <h1>🔍 실종자 식별 AI 분석 리포트</h1>
        <div class=\"meta\">
            <div>케이스 ID: {case_id}</div>
            <div>생성 시각: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</div>
            <div>총 입력 프레임: {len(frames)}</div>
        </div>

        <h2>🧠 Claude 요약</h2>
        <div class=\"frame-section\">
            <pre>{analysis.get('full_analysis', '요약을 생성하지 못했습니다.')}</pre>
        </div>

        {montage_section}

        <h2>📊 프레임별 상세 기록</h2>
        {''.join(frame_sections)}

        <h2>✨ 사용된 기술</h2>
        <ul class=\"tech-list\">
            <li><strong>Claude Opus 4.1:</strong> 인물 특징 분석 및 요약</li>
            <li><strong>Titan Image Generator v2 + Nova Canvas:</strong> 다단계 Super Resolution</li>
            <li><strong>Nova Canvas:</strong> 몽타주 생성 및 얼굴 리파인먼트</li>
            <li><strong>OpenCV:</strong> 얼굴 검출 및 크롭</li>
        </ul>
    </div>
</body>
</html>
"""

        report_s3_url = self.s3_manager.upload_text_to_s3(
            html_content, case_id, "final_report.html", "case1_montage"
        )
        print(f"💾 HTML 리포트 S3 저장: {report_s3_url}")

        preview_s3_url = self.generate_report_preview_image(results, analysis, case_id)

        return report_s3_url, preview_s3_url

    def generate_report_preview_image(self, results: Dict, analysis: Dict, case_id: str) -> Optional[str]:
        """리포트 주요 내용을 PNG 이미지로 요약"""
        frames: List[Dict] = results.get('frames', [])
        if not frames:
            return None

        width, height = 1600, 900
        preview = Image.new('RGB', (width, height), '#101522')
        draw = ImageDraw.Draw(preview)
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()

        def draw_text(text: str, position: Tuple[int, int], font, fill='#FFFFFF', max_width=60):
            wrapped = textwrap.fill(text, width=max_width)
            draw.multiline_text(position, wrapped, font=font, fill=fill, spacing=6)

        draw_text(f"Case ID: {case_id}", (40, 40), font_title, '#ffffff', max_width=80)
        summary_text = analysis.get('full_analysis', '').strip()[:600]
        if summary_text:
            draw_text("핵심 요약:", (40, 90), font_title, '#8fb9ff', max_width=80)
            draw_text(summary_text, (40, 130), font_body, '#e4ebff', max_width=80)

        thumb_area = (width - 40, height - 60)
        thumb_width = 320
        spacing = 20
        max_thumbs = min(3, len(frames))
        for idx in range(max_thumbs):
            frame = frames[idx]
            thumb = ImageOps.fit(frame['enhanced'], (thumb_width, thumb_width), Image.Resampling.LANCZOS)
            x = 40 + idx * (thumb_width + spacing)
            y = height - thumb_width - 40
            preview.paste(thumb, (x, y))
            draw_text(f"프레임 {frame['index']}", (x, y - 24), font_body, '#8fb9ff', max_width=30)

        preview_s3_url = self.s3_manager.upload_pil_image_to_s3(
            preview, case_id, "final_report_preview.png", "case1_montage"
        )
        print(f"💾 리포트 프리뷰 이미지 S3 저장: {preview_s3_url}")
        return preview_s3_url

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock Enhanced - 케이스 1")
    parser.add_argument("image_source", nargs="?", help="분석할 CCTV 이미지 또는 S3 prefix")
    parser.add_argument("--input-prefix", help="S3 prefix (예: s3://bucket/inputs/missing-person-1)")
    parser.add_argument("--case-id", "-c", help="케이스 ID (미지정시 자동 생성)")
    parser.add_argument("--bucket", "-b", default="seoul-ht-06-dasibom", help="S3 버킷명")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전")
    parser.add_argument("--montage-style", default="hyperrealistic photograph", help="몽타주 스타일 프롬프트")

    args = parser.parse_args()

    image_source = args.input_prefix or args.image_source
    if not image_source:
        parser.error("이미지 경로 또는 --input-prefix 를 지정해야 합니다.")

    # Enhanced 파이프라인 실행
    processor = EnhancedBedrockCase1(region_name=args.region, bucket_name=args.bucket)
    results = processor.process_complete_pipeline(image_source, args.case_id, montage_style=args.montage_style)
    
    print(f"\n🎉 처리 완료!")
    print(f"📋 케이스 ID: {results['case_id']}")
    print(f"🔗 S3 결과 URL들:")
    for key, url in results['s3_urls'].items():
        print(f"  - {key}: {url}")

if __name__ == "__main__":
    main()
