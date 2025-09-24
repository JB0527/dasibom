import torch
from diffusers import DiffusionPipeline
from PIL import Image
import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import os
import argparse
import json

class MissingPersonCase2:
    def __init__(self):
        """케이스 2: 구조화된 정보 → SDXL 전신 생성 → 얼굴 교체"""
        print("모델 로딩 중...")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"디바이스: {self.device}")
        
        # SDXL 파이프라인 로드
        print("SDXL 모델 로딩...")
        self.sdxl_pipeline = DiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            use_safetensors=True,
            variant="fp16" if self.device == "cuda" else None
        ).to(self.device)
        
        # InsightFace 모델 로드
        print("InsightFace 모델 로딩...")
        self.face_app = FaceAnalysis(providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))
        
        # 얼굴 교체를 위한 모델
        self.face_swapper = insightface.model_zoo.get_model('inswapper_128.onnx', download=True, download_zip=True)
        
        print("모델 로딩 완료!\n")
    
    def create_structured_prompt(self, person_info):
        """구조화된 정보를 SDXL 프롬프트로 변환"""
        
        # 기본 정보 추출
        clothing = person_info.get('clothing', '')
        build = person_info.get('build', '')
        hair = person_info.get('hair', '')
        age = person_info.get('age', '')
        gender = person_info.get('gender', '')
        additional = person_info.get('additional_info', '')
        
        # 전문적인 프롬프트 구성
        prompt_parts = [
            f"full body portrait of a {gender}",
            f"{age} years old",
            f"with {hair}" if hair else "",
            f"{build} body type" if build else "",
            f"wearing {clothing}",
            f"{additional}" if additional else "",
            "standing straight, front view, neutral pose",
            "professional photography, studio lighting, clean background",
            "high resolution, detailed clothing, realistic, photorealistic",
            "missing person poster style, clear visibility"
        ]
        
        prompt = ", ".join([p for p in prompt_parts if p.strip()])
        
        # 얼굴 제외를 위한 부정 프롬프트
        negative_prompt = """
        blurry face, detailed face, clear facial features, 
        low quality, cartoon, anime, drawing, painting,
        multiple people, cropped, bad anatomy, deformed,
        dark lighting, shadows on face
        """
        
        return prompt, negative_prompt.strip()
    
    def generate_body_with_placeholder(self, person_info, output_dir="outputs"):
        """얼굴 영역을 흐리게 한 전신 이미지 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_structured_prompt(person_info)
        
        print("=== 전신 이미지 생성 ===")
        print(f"프롬프트: {prompt}\n")
        
        try:
            # SDXL로 전신 이미지 생성
            image = self.sdxl_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=30,
                guidance_scale=8.0,
                width=768,
                height=1024,  # 전신이므로 세로로 길게
                num_images_per_prompt=1
            ).images[0]
            
            body_path = os.path.join(output_dir, "generated_body.png")
            image.save(body_path)
            print(f"전신 이미지 저장: {body_path}")
            
            return image, body_path
            
        except Exception as e:
            print(f"이미지 생성 오류: {e}")
            return None, None
    
    def detect_and_prepare_faces(self, body_image, face_image_path):
        """얼굴 검출 및 교체 준비"""
        
        # 생성된 전신 이미지에서 얼굴 영역 찾기
        body_cv = cv2.cvtColor(np.array(body_image), cv2.COLOR_RGB2BGR)
        body_faces = self.face_app.get(body_cv)
        
        if len(body_faces) == 0:
            print("전신 이미지에서 얼굴을 찾을 수 없습니다.")
            return None, None, None
        
        # 참조 얼굴 이미지 로드 및 분석
        face_image = cv2.imread(face_image_path)
        if face_image is None:
            print(f"얼굴 이미지를 불러올 수 없습니다: {face_image_path}")
            return None, None, None
            
        face_faces = self.face_app.get(face_image)
        
        if len(face_faces) == 0:
            print("참조 이미지에서 얼굴을 찾을 수 없습니다.")
            return None, None, None
        
        print(f"전신 이미지에서 {len(body_faces)}개 얼굴 검출")
        print(f"참조 이미지에서 {len(face_faces)}개 얼굴 검출")
        
        return body_cv, body_faces[0], face_faces[0]  # 첫 번째 얼굴 사용
    
    def swap_face(self, body_image_cv, body_face, reference_face, output_dir="outputs"):
        """얼굴 교체 수행"""
        
        try:
            # InsightFace로 얼굴 교체
            result = self.face_swapper.get(body_image_cv, body_face, reference_face, paste_back=True)
            
            # BGR to RGB 변환
            result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
            result_image = Image.fromarray(result_rgb)
            
            # 결과 저장
            final_path = os.path.join(output_dir, "final_result_case2.png")
            result_image.save(final_path)
            print(f"최종 결과 저장: {final_path}")
            
            return result_image, final_path
            
        except Exception as e:
            print(f"얼굴 교체 오류: {e}")
            return None, None
    
    def process_case2(self, person_info, face_image_path, output_dir="outputs"):
        """케이스 2 전체 처리 파이프라인"""
        
        print("=== 케이스 2: 구조화된 정보 → 전신 생성 → 얼굴 교체 ===\n")
        
        # 1단계: 전신 이미지 생성
        print("🎨 1단계: 전신 이미지 생성")
        body_image, body_path = self.generate_body_with_placeholder(person_info, output_dir)
        
        if not body_image:
            return None
        
        # 2단계: 얼굴 검출 및 준비
        print("🔍 2단계: 얼굴 검출 및 분석")
        body_cv, body_face, reference_face = self.detect_and_prepare_faces(body_image, face_image_path)
        
        if body_cv is None:
            return None
        
        # 3단계: 얼굴 교체
        print("🔄 3단계: 얼굴 교체")
        final_image, final_path = self.swap_face(body_cv, body_face, reference_face, output_dir)
        
        return final_path

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 케이스 2")
    parser.add_argument("--info", "-i", required=True, help="인물 정보 JSON 파일")
    parser.add_argument("--face", "-f", required=True, help="얼굴 참조 이미지")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    # 입력 파일 확인
    if not os.path.exists(args.info):
        print(f"오류: 정보 파일을 찾을 수 없습니다: {args.info}")
        return
    
    if not os.path.exists(args.face):
        print(f"오류: 얼굴 이미지를 찾을 수 없습니다: {args.face}")
        return
    
    # 인물 정보 로드
    try:
        with open(args.info, 'r', encoding='utf-8') as f:
            person_info = json.load(f)
    except Exception as e:
        print(f"정보 파일 로드 오류: {e}")
        return
    
    print("입력 정보:")
    for key, value in person_info.items():
        print(f"  {key}: {value}")
    print()
    
    # 케이스 2 처리
    processor = MissingPersonCase2()
    result_path = processor.process_case2(person_info, args.face, args.output)
    
    if result_path:
        print(f"\n✅ 완료! 최종 결과: {result_path}")
    else:
        print("❌ 처리 실패")

if __name__ == "__main__":
    main()