import boto3
import json
import base64
import os
import argparse
from PIL import Image
import io
from typing import Dict, Optional, Tuple

class BedrockMissingPersonDemo:
    def __init__(self, region_name='us-east-1'):
        """AWS Bedrock 기반 케이스 1 데모: CCTV 이미지 → 인상착의 추출 → 몽타주 생성"""
        print("AWS Bedrock 클라이언트 초기화 중...")
        
        # Bedrock Runtime 클라이언트 초기화
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
        
        # 모델 ID
        self.claude_model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        self.sd_model_id = "stability.stable-diffusion-xl-v1-0"  # 실제 SDXL 1.0 모델 ID
        
        print(f"리전: {region_name}")
        print(f"Claude 모델: {self.claude_model_id}")
        print(f"Stable Diffusion 모델: {self.sd_model_id}")
        print("초기화 완료!\n")
    
    def encode_image(self, image_path: str) -> str:
        """이미지를 base64로 인코딩"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def analyze_person_with_claude(self, image_path: str) -> Optional[Dict[str, str]]:
        """Claude Vision을 사용한 인물 분석"""
        print(f"이미지 분석 중: {image_path}")
        
        try:
            # 이미지 인코딩
            base64_image = self.encode_image(image_path)
            
            # 분석 요청 메시지 구성
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": base64_image
                            }
                        },
                        {
                            "type": "text",
                            "text": """Please analyze this person in the image and answer the following questions in detail:
                            
1. What is this person wearing? (describe all clothing items)
2. What color is their shirt or top?
3. What are they wearing on the bottom? (pants, skirt, etc.)
4. What kind of shoes do they have?
5. Do they have any bag or accessories? (watch, jewelry, etc.)
6. What does their hair look like? (color, length, style)
7. Are they male or female?
8. How old do they look? (approximate age range)
9. What is their approximate height/build? (tall/short, slim/heavy)
10. Any other notable features? (facial hair, glasses, tattoos, etc.)

Please provide detailed answers for each question, as this information will be used to create a composite sketch."""
                        }
                    ]
                }
            ]
            
            # Claude API 호출
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1500,
                "messages": messages,
                "temperature": 0.1
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.claude_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            # 응답 파싱
            response_body = json.loads(response['body'].read())
            analysis_text = response_body['content'][0]['text']
            
            print("=== 분석 결과 ===")
            print(analysis_text)
            print("\n")
            
            # 결과를 딕셔너리로 구조화
            results = self.parse_analysis(analysis_text)
            return results
            
        except Exception as e:
            print(f"Claude API 오류: {e}")
            return None
    
    def parse_analysis(self, analysis_text: str) -> Dict[str, str]:
        """분석 텍스트를 구조화된 딕셔너리로 변환"""
        # 간단한 파싱 (실제로는 더 정교한 파싱 필요)
        lines = analysis_text.split('\n')
        results = {}
        
        question_keys = [
            "clothing", "top_color", "bottom", "shoes", "accessories",
            "hair", "gender", "age", "build", "features"
        ]
        
        current_key_idx = 0
        current_answer = []
        
        for line in lines:
            if any(str(i) in line for i in range(1, 11)):
                if current_answer and current_key_idx < len(question_keys):
                    results[question_keys[current_key_idx]] = ' '.join(current_answer).strip()
                    current_key_idx += 1
                    current_answer = []
            else:
                if line.strip():
                    current_answer.append(line.strip())
        
        # 마지막 답변 저장
        if current_answer and current_key_idx < len(question_keys):
            results[question_keys[current_key_idx]] = ' '.join(current_answer).strip()
        
        # 전체 텍스트도 저장
        results['full_analysis'] = analysis_text
        
        return results
    
    def create_sd_prompt(self, analysis_results: Dict[str, str]) -> Tuple[str, str]:
        """분석 결과를 Stable Diffusion 프롬프트로 변환"""
        
        # Claude의 전체 분석 텍스트에서 핵심 정보 추출
        full_text = analysis_results.get('full_analysis', '')
        
        # 프롬프트 구성
        prompt_parts = []
        
        # 성별과 나이 추출
        if 'male' in full_text.lower():
            prompt_parts.append("portrait of a male person")
        elif 'female' in full_text.lower():
            prompt_parts.append("portrait of a female person")
        else:
            prompt_parts.append("portrait of a person")
        
        # 나이 정보 추출
        age_keywords = ['young', 'middle-aged', 'elderly', 'years old', '20s', '30s', '40s', '50s', '60s']
        for keyword in age_keywords:
            if keyword in full_text.lower():
                prompt_parts.append(f"approximately {keyword}")
                break
        
        # 머리 스타일 정보
        hair_keywords = ['black hair', 'brown hair', 'blonde', 'short hair', 'long hair', 'curly', 'straight']
        for keyword in hair_keywords:
            if keyword in full_text.lower():
                prompt_parts.append(keyword)
        
        # 의상 정보
        clothing_keywords = ['shirt', 'jacket', 'coat', 't-shirt', 'sweater', 'suit']
        for keyword in clothing_keywords:
            if keyword in full_text.lower():
                prompt_parts.append(f"wearing {keyword}")
                break
        
        # 고정 프롬프트 요소 추가
        prompt_parts.extend([
            "realistic face",
            "detailed portrait",
            "clear features",
            "professional composite sketch",
            "police sketch style",
            "front view",
            "neutral expression",
            "high quality",
            "detailed"
        ])
        
        prompt = ", ".join(prompt_parts)
        negative_prompt = "blurry, low quality, cartoon, anime, multiple faces, deformed, distorted, abstract"
        
        return prompt, negative_prompt
    
    def generate_montage_with_bedrock(self, analysis_results: Dict[str, str], output_dir: str = "outputs") -> Tuple[Optional[Image.Image], Optional[str]]:
        """Bedrock Stable Diffusion을 사용한 몽타주 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_sd_prompt(analysis_results)
        
        print("=== 몽타주 생성 ===")
        print(f"프롬프트: {prompt}")
        print(f"부정 프롬프트: {negative_prompt}\n")
        
        try:
            # Stable Diffusion 요청 구성
            request_body = {
                "text_prompts": [
                    {"text": prompt, "weight": 1.0},
                    {"text": negative_prompt, "weight": -1.0}
                ],
                "cfg_scale": 7.5,
                "steps": 50,
                "seed": 42,
                "width": 512,
                "height": 512,
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
            output_path = os.path.join(output_dir, "bedrock_montage.png")
            image.save(output_path)
            print(f"몽타주 저장됨: {output_path}")
            
            return image, output_path
            
        except Exception as e:
            print(f"Stable Diffusion API 오류: {e}")
            return None, None
    
    def save_analysis_report(self, analysis_results: Dict[str, str], output_dir: str = "outputs"):
        """분석 결과를 텍스트 파일로 저장"""
        os.makedirs(output_dir, exist_ok=True)
        
        report_path = os.path.join(output_dir, "bedrock_analysis_report.txt")
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("=== AWS Bedrock 인물 분석 결과 ===\n\n")
            f.write("Claude Vision Analysis:\n")
            f.write("-" * 50 + "\n")
            f.write(analysis_results.get('full_analysis', 'No analysis available'))
            f.write("\n" + "=" * 50 + "\n")
        
        print(f"분석 보고서 저장됨: {report_path}")
        return report_path

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock 기반 실종자 찾기 AI - 케이스 1")
    parser.add_argument("image_path", help="분석할 CCTV 이미지 경로")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전 (기본: us-east-1)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(f"오류: 이미지 파일을 찾을 수 없습니다: {args.image_path}")
        return
    
    print("=== AWS Bedrock 실종자 찾기 AI - 케이스 1 ===")
    print("CCTV 이미지 → Claude Vision 분석 → Stable Diffusion 몽타주 생성\n")
    
    # 데모 실행
    demo = BedrockMissingPersonDemo(region_name=args.region)
    
    # 1단계: Claude Vision으로 인물 분석
    print("🔍 1단계: Claude Vision으로 인물 특징 분석")
    analysis = demo.analyze_person_with_claude(args.image_path)
    
    if not analysis:
        print("이미지 분석에 실패했습니다.")
        return
    
    # 분석 결과 저장
    demo.save_analysis_report(analysis, args.output)
    
    # 2단계: Stable Diffusion으로 몽타주 생성
    print("🎨 2단계: Stable Diffusion으로 몽타주 생성")
    montage, output_path = demo.generate_montage_with_bedrock(analysis, args.output)
    
    if montage:
        print(f"\n✅ 완료! 결과는 {args.output} 폴더에 저장되었습니다.")
        print(f"  - 몽타주: {output_path}")
        print(f"  - 분석 보고서: {os.path.join(args.output, 'bedrock_analysis_report.txt')}")
    else:
        print("몽타주 생성에 실패했습니다.")

if __name__ == "__main__":
    main()