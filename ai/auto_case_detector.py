"""
실종자 폴더의 이미지들을 자동 분석하여 적절한 케이스를 결정하고 실행
"""

import boto3
import json
import os
from PIL import Image
import io
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from s3_utils import S3Manager

class AutoCaseDetector:
    def __init__(self, region_name='us-east-1', bucket_name='dasibom-ai-results'):
        self.s3_manager = S3Manager(bucket_name, region_name)
        self.bucket_name = bucket_name
        
        # Claude로 이미지 분석할 Bedrock 클라이언트
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime', 
            region_name=region_name
        )
        
        # 얼굴 검출기 
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
    
    def get_missing_person_images(self, missing_person_id: int) -> List[str]:
        """실종자 ID의 입력 폴더에서 모든 이미지 URL 가져오기"""
        s3_prefix = f"inputs/missing-person-{missing_person_id}/"
        
        try:
            response = self.s3_manager.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=s3_prefix
            )
            
            image_urls = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    # 이미지 파일만 필터링
                    if key.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                        s3_url = f"s3://{self.bucket_name}/{key}"
                        image_urls.append(s3_url)
            
            print(f"✅ 실종자 {missing_person_id}: {len(image_urls)}개 이미지 발견")
            return image_urls
            
        except Exception as e:
            print(f"❌ 이미지 목록 조회 실패: {e}")
            return []
    
    def analyze_image_type_with_claude(self, image_url: str) -> Dict:
        """Claude로 이미지 타입 분석"""
        try:
            image_base64 = self.s3_manager.encode_image_from_source(image_url)
            
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
                            "text": """이 이미지를 분석해서 다음 중 어떤 타입인지 판단해주세요:

1. CCTV: 보안카메라나 감시카메라로 촬영된 이미지 (흐릿하거나 원거리, 상단 시점)
2. FACE: 얼굴 위주의 근접 촬영 사진 (증명사진, 셀피, 인물사진) 
3. REFERENCE: 가족사진, 단체사진, 일상사진 등 참고용 이미지

JSON 형식으로만 답변해주세요:
{
  "type": "CCTV|FACE|REFERENCE", 
  "confidence": 0.8,
  "reason": "판단 근거"
}"""
                        }
                    ]
                }
            ]
            
            response = self.bedrock_runtime.invoke_model(
                modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
                contentType="application/json",
                accept="application/json", 
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 500,
                    "messages": messages,
                    "temperature": 0.1
                })
            )
            
            response_body = json.loads(response['body'].read())
            analysis_text = response_body['content'][0]['text']
            
            # JSON 파싱 시도
            try:
                result = json.loads(analysis_text)
                return result
            except:
                # JSON 파싱 실패시 기본값
                return {"type": "REFERENCE", "confidence": 0.5, "reason": "파싱 실패"}
                
        except Exception as e:
            print(f"⚠️ Claude 분석 실패: {e}")
            return {"type": "REFERENCE", "confidence": 0.3, "reason": f"분석 오류: {e}"}
    
    def detect_face_quality(self, image_url: str) -> Dict:
        """얼굴 검출 및 품질 평가"""
        try:
            # 이미지 다운로드
            image_bytes = self.s3_manager.download_image_from_source(image_url)
            image = Image.open(io.BytesIO(image_bytes))
            
            # OpenCV로 변환
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # 얼굴 검출
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) > 0:
                # 가장 큰 얼굴 선택
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = largest_face
                
                # 얼굴 크기로 품질 평가 (큰 얼굴 = 근접촬영 = 좋은 품질)
                face_area = w * h
                image_area = image.width * image.height
                face_ratio = face_area / image_area
                
                return {
                    "has_face": True,
                    "face_count": len(faces),
                    "face_size": (w, h),
                    "face_ratio": face_ratio,
                    "quality_score": min(1.0, face_ratio * 5)  # 0~1 점수
                }
            else:
                return {
                    "has_face": False,
                    "face_count": 0,
                    "quality_score": 0.0
                }
                
        except Exception as e:
            print(f"⚠️ 얼굴 검출 실패: {e}")
            return {"has_face": False, "face_count": 0, "quality_score": 0.0}
    
    def categorize_images(self, image_urls: List[str]) -> Dict:
        """이미지들을 카테고리별로 분류"""
        categorized = {
            "cctv_images": [],
            "face_images": [], 
            "reference_images": []
        }
        
        for image_url in image_urls:
            print(f"🔍 분석 중: {os.path.basename(image_url)}")
            
            # Claude로 타입 분석
            claude_analysis = self.analyze_image_type_with_claude(image_url)
            
            # 얼굴 검출 분석  
            face_analysis = self.detect_face_quality(image_url)
            
            # 종합 판단
            image_type = claude_analysis.get("type", "REFERENCE")
            confidence = claude_analysis.get("confidence", 0.5)
            has_face = face_analysis.get("has_face", False)
            face_quality = face_analysis.get("quality_score", 0.0)
            
            image_info = {
                "url": image_url,
                "claude_type": image_type,
                "confidence": confidence,
                "has_face": has_face,
                "face_quality": face_quality,
                "reason": claude_analysis.get("reason", "")
            }
            
            # 분류 로직
            if image_type == "CCTV" and confidence > 0.6:
                categorized["cctv_images"].append(image_info)
            elif image_type == "FACE" and confidence > 0.6 and has_face:
                categorized["face_images"].append(image_info)
            elif has_face and face_quality > 0.3:  # 얼굴이 있고 품질 괜찮으면 얼굴 이미지로
                categorized["face_images"].append(image_info)
            else:
                categorized["reference_images"].append(image_info)
            
            print(f"  → {image_type} (신뢰도: {confidence:.2f}, 얼굴: {has_face})")
        
        return categorized
    
    def determine_executable_cases(self, categorized_images: Dict) -> List[str]:
        """실행 가능한 케이스들 결정"""
        executable_cases = []
        
        cctv_count = len(categorized_images["cctv_images"])
        face_count = len(categorized_images["face_images"]) 
        
        print(f"\n📊 이미지 분류 결과:")
        print(f"  CCTV: {cctv_count}장")
        print(f"  얼굴: {face_count}장") 
        print(f"  참고: {len(categorized_images['reference_images'])}장")
        
        # Case 1: CCTV 이미지가 있으면 실행 가능
        if cctv_count > 0:
            executable_cases.append("case1")
            print("✅ Case 1 실행 가능: CCTV → 몽타주")
        
        # Case 2: 얼굴 이미지가 있으면 실행 가능 (person_info.json은 별도 확인 필요)
        if face_count > 0:
            executable_cases.append("case2") 
            print("✅ Case 2 실행 가능: 얼굴 + 정보 → 전신")
        
        # Case 3: CCTV + 얼굴이 모두 있으면 실행 가능
        if cctv_count > 0 and face_count > 0:
            executable_cases.append("case3")
            print("✅ Case 3 실행 가능: CCTV + 얼굴 → 수사보고서")
        
        # Super Resolution: 모든 이미지에 적용 가능
        if cctv_count > 0 or face_count > 0:
            executable_cases.append("super_resolution")
            print("✅ Super Resolution 실행 가능: 화질 개선")
        
        return executable_cases
    
    def select_best_images(self, categorized_images: Dict) -> Dict:
        """각 케이스에 사용할 최적의 이미지 선택"""
        selected = {}
        
        # Case 1용: 가장 좋은 CCTV 이미지
        if categorized_images["cctv_images"]:
            best_cctv = max(categorized_images["cctv_images"], 
                           key=lambda x: x["confidence"])
            selected["case1_cctv"] = best_cctv["url"]
        
        # Case 2, 3용: 가장 좋은 얼굴 이미지  
        if categorized_images["face_images"]:
            best_face = max(categorized_images["face_images"],
                           key=lambda x: x["face_quality"])
            selected["case2_face"] = best_face["url"]
            selected["case3_face"] = best_face["url"]
        
        # Case 3용: CCTV (Case1과 동일할 수 있음)
        if categorized_images["cctv_images"]:
            selected["case3_cctv"] = selected.get("case1_cctv")
        
        return selected

def main():
    """테스트 실행"""
    detector = AutoCaseDetector()
    
    # 실종자 ID 123 예시
    missing_person_id = 123
    
    # 1. 이미지 목록 가져오기
    image_urls = detector.get_missing_person_images(missing_person_id)
    
    if not image_urls:
        print("❌ 이미지가 없습니다.")
        return
    
    # 2. 이미지 분류
    categorized = detector.categorize_images(image_urls)
    
    # 3. 실행 가능한 케이스 결정
    executable_cases = detector.determine_executable_cases(categorized)
    
    # 4. 최적 이미지 선택
    selected_images = detector.select_best_images(categorized)
    
    print(f"\n🎯 실행 계획:")
    print(f"실행 가능한 케이스: {executable_cases}")
    print(f"선택된 이미지: {selected_images}")

if __name__ == "__main__":
    main()