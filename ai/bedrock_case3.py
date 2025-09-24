import boto3
import json
import base64
import os
import argparse
from PIL import Image
from datetime import datetime
from typing import Dict, Optional, List
from s3_utils import S3Manager, generate_case_id

class BedrockMissingPersonCase3:
    def __init__(self, region_name='us-east-1', bucket_name='dasibom-ai-results'):
        """AWS Bedrock 기반 케이스 3: CCTV + 얼굴 사진 → 보완 정보 추출 및 수사 보고서"""
        print("AWS Bedrock 클라이언트 초기화 중...")
        
        # EC2 IAM 역할로 Bedrock Runtime 클라이언트 초기화
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
        
        # 모델 ID
        self.claude_model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        
        print(f"리전: {region_name}")
        print(f"Claude 모델: {self.claude_model_id}")
        print("초기화 완료!\n")
    
    def encode_image(self, image_source: str) -> str:
        """이미지를 base64로 인코딩 (S3, URL, 로컬 파일 지원)"""
        return self.s3_manager.encode_image_from_source(image_source)
    
    def analyze_cctv_context(self, cctv_image_path: str) -> Optional[Dict]:
        """Claude를 사용하여 CCTV 이미지의 상황 맥락 분석"""
        print(f"CCTV 상황 맥락 분석 중: {cctv_image_path}")
        
        try:
            base64_image = self.encode_image(cctv_image_path)
            
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
                            "text": """Please analyze this CCTV image and provide detailed information about the context and environment. Answer the following questions:

ENVIRONMENTAL CONTEXT:
1. What time of day does this appear to be? (morning, afternoon, evening, night)
2. What is the weather condition? (sunny, cloudy, rainy, snowy)
3. What season does this appear to be?
4. What type of location is this? (street, building entrance, park, shopping area, etc.)
5. Is this indoor or outdoor?
6. What is the lighting condition? (bright, dim, artificial lighting, natural daylight)

BACKGROUND DETAILS:
7. What buildings or structures are visible?
8. Are there any signs, billboards, or text visible? If so, what do they say?
9. Are there any vehicles visible? What types?
10. Are there other people visible in the background?

PERSON'S SITUATION:
11. What is the person doing? (walking, standing, sitting, running)
12. Which direction are they moving/facing?
13. Are they alone or with others?
14. What is their pace? (fast, slow, normal)
15. What is their posture like?

INVESTIGATION CLUES:
16. Are there any security cameras or monitoring equipment visible?
17. Any landmarks or distinctive features that could help identify the location?
18. Any unusual or suspicious activities in the scene?
19. Any items dropped or left behind?
20. Any other people who might be witnesses?

Please provide detailed, specific answers that would be useful for an investigation."""
                        }
                    ]
                }
            ]
            
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
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
            context_analysis = response_body['content'][0]['text']
            
            print("=== CCTV 상황 분석 완료 ===")
            print(context_analysis[:500] + "..." if len(context_analysis) > 500 else context_analysis)
            print("\n")
            
            return {
                'context_analysis': context_analysis,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"CCTV 분석 오류: {e}")
            return None
    
    def analyze_person_details(self, cctv_image_path: str) -> Optional[Dict]:
        """Claude를 사용하여 인물의 세부 특징 분석"""
        print(f"인물 세부 특징 분석 중: {cctv_image_path}")
        
        try:
            base64_image = self.encode_image(cctv_image_path)
            
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
                            "text": """Please analyze the person in this image with forensic-level detail. Focus on characteristics that would be useful for identification:

PHYSICAL APPEARANCE:
1. Approximate height and build (tall/short, slim/heavy, muscular/average)
2. Hair color, length, and style
3. Skin tone and any visible marks or tattoos
4. Facial hair (beard, mustache, clean-shaven)
5. Approximate age range
6. Gender
7. Any physical disabilities or distinctive gait

CLOTHING AND ACCESSORIES:
8. Detailed description of upper body clothing (color, style, brand if visible)
9. Lower body clothing description
10. Footwear type and color
11. Any bags, backpacks, or carrying items
12. Jewelry, watches, or accessories
13. Hat or head covering
14. Glasses or sunglasses

BEHAVIORAL CHARACTERISTICS:
15. Walking style and gait
16. Posture and body language
17. Hand positions and gestures
18. Interaction with environment
19. Apparent emotional state
20. Any nervous or distinctive behaviors

DISTINCTIVE FEATURES:
21. Any unique identifying characteristics
22. Scars, birthmarks, or other permanent features
23. Distinctive clothing items or accessories
24. Any objects being carried
25. Any technology devices visible (phone, headphones, etc.)

Provide specific, detailed observations that would help in person identification."""
                        }
                    ]
                }
            ]
            
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
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
            person_analysis = response_body['content'][0]['text']
            
            print("=== 인물 세부 분석 완료 ===")
            print(person_analysis[:500] + "..." if len(person_analysis) > 500 else person_analysis)
            print("\n")
            
            return {
                'person_analysis': person_analysis,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"인물 분석 오류: {e}")
            return None
    
    def compare_with_known_info(self, cctv_analysis: Dict, person_analysis: Dict, known_info_path: Optional[str] = None) -> Dict:
        """기존 정보와 비교하여 새로운 단서 발견"""
        print("기존 정보와의 비교 분석 중...")
        
        known_info = {}
        if known_info_path and os.path.exists(known_info_path):
            try:
                with open(known_info_path, 'r', encoding='utf-8') as f:
                    known_info = json.load(f)
                print(f"기존 정보 로드: {known_info_path}")
            except Exception as e:
                print(f"기존 정보 로드 실패: {e}")
        
        try:
            # Claude를 사용하여 비교 분석
            comparison_prompt = f"""
Please analyze and compare the following information to identify new clues and insights:

CCTV CONTEXT ANALYSIS:
{cctv_analysis.get('context_analysis', 'No context analysis available')}

PERSON DETAIL ANALYSIS:
{person_analysis.get('person_analysis', 'No person analysis available')}

EXISTING KNOWN INFORMATION:
{json.dumps(known_info, ensure_ascii=False, indent=2) if known_info else 'No existing information provided'}

Please provide:
1. NEW CLUES discovered from the CCTV analysis that weren't in existing information
2. CONTRADICTIONS between CCTV analysis and existing information
3. CONFIRMATIONS of existing information
4. INVESTIGATIVE RECOMMENDATIONS based on the analysis
5. PRIORITY AREAS for further investigation
6. POTENTIAL LEADS that should be followed up

Format your response as a structured investigation report.
"""

            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": comparison_prompt
                        }
                    ]
                }
            ]
            
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "messages": messages,
                "temperature": 0.2
            }
            
            response = self.bedrock_runtime.invoke_model(
                modelId=self.claude_model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response['body'].read())
            comparison_analysis = response_body['content'][0]['text']
            
            print("=== 비교 분석 완료 ===")
            
            return {
                'comparison_analysis': comparison_analysis,
                'known_info': known_info,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"비교 분석 오류: {e}")
            return {
                'comparison_analysis': f"비교 분석 중 오류 발생: {e}",
                'known_info': known_info,
                'timestamp': datetime.now().isoformat()
            }
    
    def generate_investigation_report(self, cctv_analysis: Dict, person_analysis: Dict, comparison_result: Dict, face_image_path: Optional[str] = None, output_dir: str = "outputs") -> str:
        """종합 수사 보고서 생성"""
        print("종합 수사 보고서 생성 중...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 얼굴 사진이 있는 경우 분석 추가
        face_analysis = ""
        if face_image_path and os.path.exists(face_image_path):
            try:
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
                                "text": "Please provide a detailed facial analysis of this person including distinctive features, estimated age, ethnicity, and any unique characteristics that would help in identification."
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
                face_analysis = response_body['content'][0]['text']
                
            except Exception as e:
                face_analysis = f"얼굴 분석 중 오류 발생: {e}"
        
        # 종합 보고서 작성
        report = f"""
==========================================================
                    실종자 수사 종합 보고서
                   AWS Bedrock Claude 분석 결과
==========================================================

보고서 생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

=== 1. CCTV 상황 분석 ===
{cctv_analysis.get('context_analysis', 'CCTV 분석 데이터 없음')}

=== 2. 인물 세부 특징 분석 ===
{person_analysis.get('person_analysis', '인물 분석 데이터 없음')}

=== 3. 얼굴 특징 분석 ===
{face_analysis if face_analysis else '얼굴 사진이 제공되지 않았거나 분석할 수 없음'}

=== 4. 기존 정보와의 비교 분석 ===
{comparison_result.get('comparison_analysis', '비교 분석 데이터 없음')}

=== 5. 기존 알려진 정보 ===
{json.dumps(comparison_result.get('known_info', {}), ensure_ascii=False, indent=2)}

==========================================================
                       보고서 요약
==========================================================

이 보고서는 AWS Bedrock의 Claude Vision AI를 사용하여
CCTV 영상과 관련 정보를 종합 분석한 결과입니다.

수사 담당자는 이 정보를 바탕으로 추가 조사 방향을 
결정하고 실종자 수색에 활용하시기 바랍니다.

※ 주의: AI 분석 결과는 참고용이며, 최종 판단은 
전문 수사관이 내려야 합니다.
==========================================================
"""
        
        # S3에 보고서 저장
        case_id = generate_case_id() if not hasattr(self, '_current_case_id') else self._current_case_id
        report_s3_url = self.s3_manager.upload_text_to_s3(
            report, case_id, f"investigation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", "case3_investigation"
        )
        
        print(f"종합 수사 보고서 S3 저장: {report_s3_url}")
        return report_s3_url

def main():
    parser = argparse.ArgumentParser(description="AWS Bedrock 기반 실종자 찾기 AI - 케이스 3")
    parser.add_argument("cctv_image", help="CCTV 이미지 (S3 URL, HTTP URL, 또는 로컬 경로)")
    parser.add_argument("-f", "--face", help="얼굴 참조 사진 (S3 URL, HTTP URL, 또는 로컬 경로, 선택사항)")
    parser.add_argument("-k", "--known", help="기존 정보 JSON 파일 경로 (선택사항)")
    parser.add_argument("--case-id", "-c", help="케이스 ID (미지정시 자동 생성)")
    parser.add_argument("--bucket", "-b", default="dasibom-ai-results", help="S3 버킷명")
    parser.add_argument("--region", "-r", default="us-east-1", help="AWS 리전 (기본: us-east-1)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.cctv_image):
        print(f"오류: CCTV 이미지를 찾을 수 없습니다: {args.cctv_image}")
        return
    
    print("=== AWS Bedrock 실종자 찾기 AI - 케이스 3 ===")
    print("CCTV + 얼굴 사진 → 보완 정보 추출 → 종합 수사 보고서\n")
    
    # 데모 실행
    demo = BedrockMissingPersonCase3(region_name=args.region, bucket_name=args.bucket)
    
    # 케이스 ID 설정
    case_id = args.case_id or generate_case_id()
    demo._current_case_id = case_id
    print(f"📋 케이스 ID: {case_id}")
    
    # 1단계: CCTV 상황 분석
    print("🔍 1단계: CCTV 상황 맥락 분석")
    cctv_analysis = demo.analyze_cctv_context(args.cctv_image)
    
    if not cctv_analysis:
        print("CCTV 분석에 실패했습니다.")
        return
    
    # 2단계: 인물 세부 특징 분석
    print("👤 2단계: 인물 세부 특징 분석")
    person_analysis = demo.analyze_person_details(args.cctv_image)
    
    if not person_analysis:
        print("인물 분석에 실패했습니다.")
        return
    
    # 3단계: 기존 정보와 비교
    print("🔄 3단계: 기존 정보와의 비교 분석")
    comparison_result = demo.compare_with_known_info(cctv_analysis, person_analysis, args.known)
    
    # 4단계: 종합 보고서 생성
    print("📋 4단계: 종합 수사 보고서 생성")
    report_path = demo.generate_investigation_report(
        cctv_analysis, 
        person_analysis, 
        comparison_result, 
        args.face, 
        args.output
    )
    
    print(f"\n🎉 완료! 종합 수사 보고서가 생성되었습니다:")
    print(f"📋 케이스 ID: {case_id}")
    print(f"📄 S3 보고서: {report_path}")
    
    if args.face:
        print(f"👤 얼굴 참조 사진 포함 분석 완료")
    
    if args.known:
        print(f"🔍 기존 정보와의 비교 분석 포함")

if __name__ == "__main__":
    main()