import boto3
import json
import base64
import os
import argparse
from PIL import Image
import io
from typing import Dict, Optional, Tuple
import numpy as np

class BedrockMissingPersonCase2:
    def __init__(self, region_name='us-east-1'):
        """AWS Bedrock 기반 케이스 2: 구조화된 정보 → 전신 생성 → 얼굴 합성"""
        print("AWS Bedrock 클라이언트 초기화 중...")
        
        # Bedrock Runtime 클라이언트 초기화
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
        
        # 모델 ID
        self.sd_model_id = "stability.stable-diffusion-xl-v1-0"  # 실제 SDXL 1.0 모델 ID
        self.claude_model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        
        print(f"리전: {region_name}")
        print(f"Stable Diffusion 모델: {self.sd_model_id}")
        print(f"Claude 모델: {self.claude_model_id}")
        print("초기화 완료!\n")
    
    def encode_image(self, image_path: str) -> str:
        """이미지를 base64로 인코딩"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def create_structured_prompt(self, person_info: Dict) -> Tuple[str, str]:
        """구조화된 정보를 Stable Diffusion 프롬프트로 변환"""
        
        # 기본 정보 추출
        clothing = person_info.get('clothing', '')
        build = person_info.get('build', '')
        hair = person_info.get('hair', '')
        age = person_info.get('age', '')
        gender = person_info.get('gender', 'person')
        height = person_info.get('height', '')
        additional = person_info.get('additional_info', '')
        
        # 전문적인 프롬프트 구성
        prompt_parts = [
            f"full body portrait of a {gender}",
            f"approximately {age} years old" if age else "",
            f"with {hair}" if hair else "",
            f"{build} body type" if build else "",
            f"{height}" if height else "",
            f"wearing {clothing}" if clothing else "",
            f"{additional}" if additional else "",
            "standing straight, front view, neutral pose",
            "professional photography, studio lighting",
            "white clean background",
            "high resolution, detailed clothing",
            "realistic, photorealistic",
            "missing person poster style",
            "clear visibility, full figure visible",
            "head to toe view"
        ]
        
        prompt = ", ".join([p for p in prompt_parts if p.strip()])
        
        # 얼굴 부분을 흐리게 하기 위한 부정 프롬프트
        negative_prompt = "close-up face, detailed facial features, portrait, headshot, cropped body, partial view, low quality, cartoon, anime, drawing, painting, multiple people, bad anatomy, deformed, dark lighting, shadows"
        
        return prompt, negative_prompt
    
    def generate_body_image(self, person_info: Dict, output_dir: str = "outputs") -> Tuple[Optional[Image.Image], Optional[str]]:
        """Bedrock Stable Diffusion으로 전신 이미지 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_structured_prompt(person_info)
        
        print("=== 전신 이미지 생성 ===")
        print(f"프롬프트: {prompt}")
        print(f"부정 프롬프트: {negative_prompt}\n")
        
        try:
            # Stable Diffusion 요청 구성
            request_body = {
                "text_prompts": [
                    {"text": prompt, "weight": 1.0},
                    {"text": negative_prompt, "weight": -1.0}
                ],
                "cfg_scale": 8.0,
                "steps": 50,
                "seed": 42,
                "width": 768,
                "height": 1024,  # 전신 이미지를 위한 세로 비율
                "style_preset": "photographic"
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.sd_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            # 응답 파싱
            response_body = json.loads(response['body'].read())
            
            # base64 이미지 디코드
            image_data = base64.b64decode(response_body['artifacts'][0]['base64'])
            image = Image.open(io.BytesIO(image_data))
            
            # 이미지 저장
            body_path = os.path.join(output_dir, "bedrock_generated_body.png")
            image.save(body_path)
            print(f"전신 이미지 저장: {body_path}")
            
            return image, body_path
            
        except Exception as e:
            print(f"Stable Diffusion API 오류: {e}")
            return None, None
    
    def enhance_with_face(self, body_image_path: str, face_image_path: str, output_dir: str = "outputs") -> Tuple[Optional[Image.Image], Optional[str]]:
        """Claude를 사용하여 얼굴 합성 가이드 생성 (실제 얼굴 합성은 별도 처리 필요)"""
        
        print("=== 얼굴 합성 프로세스 ===")
        print("참고: AWS Bedrock은 직접적인 얼굴 교체 기능을 제공하지 않습니다.")
        print("대신 얼굴 특징을 반영한 새로운 전신 이미지를 생성합니다.\n")
        
        try:
            # 얼굴 이미지 분석
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
                            "text": """Please analyze this face image and provide detailed description of:
                            1. Face shape (round, oval, square, etc.)
                            2. Skin tone
                            3. Eye shape and color
                            4. Nose characteristics
                            5. Mouth/lip characteristics
                            6. Any distinctive facial features
                            7. Estimated ethnicity/race
                            8. Any visible marks, scars, or unique features
                            
                            Provide a detailed description that could be used to recreate this face."""
                        }
                    ]
                }
            ]
            
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": messages,
                "temperature": 0.1
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.claude_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            face_description = response_body['content'][0]['text']
            
            print("얼굴 특징 분석 완료:")
            print(face_description)
            print("\n")
            
            # 분석 결과 저장
            analysis_path = os.path.join(output_dir, "face_analysis.txt")
            with open(analysis_path, 'w', encoding='utf-8') as f:
                f.write("=== 얼굴 특징 분석 ===\n\n")
                f.write(face_description)
            
            # 참고용 복사본 저장 (실제 얼굴 교체는 별도 도구 필요)
            body_image = Image.open(body_image_path)
            face_image = Image.open(face_image_path)
            
            # 얼굴 이미지를 작게 만들어 전신 이미지 옆에 배치
            face_resized = face_image.resize((200, 200))
            
            # 합성 이미지 생성 (참고용)
            combined = Image.new('RGB', (body_image.width + 220, body_image.height), 'white')
            combined.paste(body_image, (0, 0))
            combined.paste(face_resized, (body_image.width + 10, 10))
            
            output_path = os.path.join(output_dir, "bedrock_combined_reference.png")
            combined.save(output_path)
            
            print(f"참고 이미지 저장: {output_path}")
            print("\n주의: 실제 얼굴 교체를 위해서는 InsightFace 등의 별도 도구가 필요합니다.")
            
            return combined, output_path
            
        except Exception as e:
            print(f"얼굴 분석 오류: {e}")
            return None, None
    
    def generate_with_face_features(self, person_info: Dict, face_description: str, output_dir: str = "outputs") -> Tuple[Optional[Image.Image], Optional[str]]:
        """얼굴 특징을 반영한 전신 이미지 재생성"""
        
        # 얼굴 특징을 포함한 상세 프롬프트 생성
        base_prompt, _ = self.create_structured_prompt(person_info)
        
        # 얼굴 특징을 프롬프트에 추가
        enhanced_prompt = f"{base_prompt}, {face_description}, detailed face, clear facial features, recognizable face"
        
        negative_prompt = "blurry face, obscured face, low quality, cartoon, anime, multiple people"
        
        print("=== 얼굴 특징이 반영된 전신 이미지 생성 ===")
        print(f"강화된 프롬프트: {enhanced_prompt[:200]}...\n")
        
        try:
            request_body = {
                "text_prompts": [
                    {"text": enhanced_prompt, "weight": 1.2},
                    {"text": negative_prompt, "weight": -1.0}
                ],
                "cfg_scale": 10.0,
                "steps": 75,
                "seed": 42,
                "width": 768,
                "height": 1024,
                "style_preset": "photographic"
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.sd_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            image_data = base64.b64decode(response_body['artifacts'][0]['base64'])
            image = Image.open(io.BytesIO(image_data))
            
            output_path = os.path.join(output_dir, "bedrock_final_with_face.png")
            image.save(output_path)
            print(f"최종 이미지 저장: {output_path}")
            
            return image, output_path
            
        except Exception as e:
            print(f"이미지 생성 오류: {e}")
            return None, None

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock 기반 실종자 찾기 AI - 케이스 2")
    parser.add_argument("-i", "--info", required=True, help="인물 정보 JSON 파일 경로")
    parser.add_argument("-f", "--face", help="얼굴 참조 사진 경로 (선택사항)")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전 (기본: us-east-1)")
    
    args = parser.parse_args()
    
    # JSON 파일 읽기
    if not os.path.exists(args.info):
        print(f"오류: JSON 파일을 찾을 수 없습니다: {args.info}")
        return
    
    with open(args.info, 'r', encoding='utf-8') as f:
        person_info = json.load(f)
    
    print("=== AWS Bedrock 실종자 찾기 AI - 케이스 2 ===")
    print("구조화된 정보 → Stable Diffusion 전신 생성 → 얼굴 특징 반영\n")
    print(f"입력 정보: {json.dumps(person_info, ensure_ascii=False, indent=2)}\n")
    
    # 데모 실행
    demo = BedrockMissingPersonCase2(region_name=args.region)
    
    # 1단계: 전신 이미지 생성
    print("🎨 1단계: 전신 이미지 생성")
    body_image, body_path = demo.generate_body_image(person_info, args.output)
    
    if not body_image:
        print("전신 이미지 생성에 실패했습니다.")
        return
    
    # 2단계: 얼굴 사진이 제공된 경우 처리
    if args.face and os.path.exists(args.face):
        print("\n👤 2단계: 얼굴 특징 분석 및 합성")
        
        # 얼굴 분석
        combined, combined_path = demo.enhance_with_face(body_path, args.face, args.output)
        
        # 얼굴 특징 추출 (간단한 설명 사용)
        print("\n🔄 3단계: 얼굴 특징을 반영한 전신 이미지 재생성")
        face_features = "detailed realistic face with natural features"
        final_image, final_path = demo.generate_with_face_features(person_info, face_features, args.output)
        
        if final_image:
            print(f"\n✅ 완료! 모든 결과가 {args.output} 폴더에 저장되었습니다.")
            print(f"  - 기본 전신: {body_path}")
            print(f"  - 참고 이미지: {combined_path}")
            print(f"  - 최종 이미지: {final_path}")
    else:
        print(f"\n✅ 완료! 전신 이미지가 {body_path}에 저장되었습니다.")
        print("참고: 얼굴 사진을 제공하면 더 정확한 결과를 얻을 수 있습니다.")

if __name__ == "__main__":
    main()