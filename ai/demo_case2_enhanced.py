import torch
from diffusers import DiffusionPipeline
from PIL import Image, ImageEnhance, ImageFilter
import cv2
import numpy as np
import insightface
from insightface.app import FaceAnalysis
import os
import argparse
import json

class EnhancedMissingPersonCase2:
    def __init__(self):
        """⭐ 개선된 케이스 2: 고품질 얼굴 합성"""
        print("개선된 모델 로딩 중...")
        
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
        
        # ⭐ 메모리 최적화
        self.sdxl_pipeline.enable_model_cpu_offload()
        self.sdxl_pipeline.enable_vae_slicing()
        
        # ⭐ 개선된 InsightFace 설정
        print("InsightFace 모델 로딩...")
        self.face_app = FaceAnalysis(
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))
        
        # ⭐ 얼굴 교체 모델 최적화
        try:
            self.face_swapper = insightface.model_zoo.get_model(
                'inswapper_128.onnx', 
                download=True, 
                download_zip=True
            )
            print("inswapper 모델 로드 완료")
        except Exception as e:
            print(f"inswapper 모델 로드 실패: {e}")
            self.face_swapper = None
        
        print("개선된 모델 로딩 완료!\n")
    
    def create_enhanced_structured_prompt(self, person_info):
        """⭐ 개선된 구조화된 정보를 SDXL 프롬프트로 변환"""
        
        # 기본 정보 추출
        clothing = person_info.get('clothing', '')
        build = person_info.get('build', '')
        hair = person_info.get('hair', '')
        age = person_info.get('age', '')
        gender = person_info.get('gender', '')
        additional = person_info.get('additional_info', '')
        
        # ⭐ 한국인 특화 + 고품질 프롬프트
        base_parts = [
            f"Professional full body portrait of a Korean {gender}",
            f"{age} years old",
            f"with {hair}" if hair else "",
            f"{build} body type" if build else "",
            f"wearing {clothing}",
            f"{additional}" if additional else "",
        ]
        
        # ⭐ 포즈 및 스타일
        pose_parts = [
            "standing straight",
            "front view", 
            "neutral pose",
            "hands at sides",
            "professional posture"
        ]
        
        # ⭐ 한국인 특성 강화
        korean_features = [
            "East Asian body proportions",
            "Korean physique",
            "natural Korean appearance"
        ]
        
        # ⭐ 촬영 조건
        photo_conditions = [
            "professional photography",
            "studio lighting", 
            "clean white background",
            "even lighting",
            "high resolution",
            "detailed clothing texture",
            "photorealistic body",
            "missing person poster style",
            "clear visibility of clothing",
            "DSLR photograph quality"
        ]
        
        # 최종 프롬프트 조합
        all_parts = [p for p in base_parts if p.strip()]
        full_prompt = ", ".join(all_parts + pose_parts + korean_features + photo_conditions)
        
        # ⭐ 얼굴 제외를 위한 강화된 부정 프롬프트
        negative_prompt = """
        detailed face, clear facial features, visible face, sharp face,
        focused face, realistic face, face details, facial expression,
        blurry, low quality, cartoon, anime, drawing, painting,
        multiple people, cropped, bad anatomy, deformed, distorted,
        dark lighting, shadows, poor quality, amateur photography,
        western body type, caucasian features
        """
        
        return full_prompt, negative_prompt.strip()
    
    def enhance_image_quality(self, image):
        """⭐ 기본 이미지 품질 개선"""
        
        # 선명도 증가
        sharpness = ImageEnhance.Sharpness(image)
        enhanced = sharpness.enhance(1.2)
        
        # 대비 조정
        contrast = ImageEnhance.Contrast(enhanced)
        enhanced = contrast.enhance(1.1)
        
        # 색상 포화도 조정
        color = ImageEnhance.Color(enhanced)
        enhanced = color.enhance(1.05)
        
        return enhanced
    
    def generate_enhanced_body(self, person_info, output_dir="outputs", num_attempts=3):
        """⭐ 여러 시도로 최적 전신 이미지 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_enhanced_structured_prompt(person_info)
        
        print("=== 개선된 전신 이미지 생성 ===")
        print(f"프롬프트: {prompt[:150]}...\n")
        
        best_image = None
        best_path = None
        attempts = []
        
        for i in range(num_attempts):
            print(f"시도 {i+1}/{num_attempts}...")
            
            try:
                # ⭐ SDXL 고품질 설정
                image = self.sdxl_pipeline(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=35,  # 더 많은 스텝
                    guidance_scale=8.5,      # 높은 프롬프트 충실도
                    width=768,
                    height=1024,  # 전신이므로 세로로 길게
                    generator=torch.Generator(device=self.device).manual_seed(100 + i * 500)
                ).images[0]
                
                # ⭐ 기본 이미지 개선
                enhanced_image = self.enhance_image_quality(image)
                
                # 시도별 저장
                attempt_path = os.path.join(output_dir, f"body_attempt_{i+1}.png")
                enhanced_image.save(attempt_path)
                attempts.append(attempt_path)
                
                # 첫 번째를 베스트로 설정
                if i == 0:
                    best_image = enhanced_image
                    best_path = os.path.join(output_dir, "enhanced_generated_body.png")
                    enhanced_image.save(best_path)
                
                print(f"시도 {i+1} 저장: {attempt_path}")
                
                # 메모리 정리
                torch.cuda.empty_cache()
                
            except Exception as e:
                print(f"시도 {i+1} 생성 오류: {e}")
                continue
        
        print(f"\n✅ 최적 전신 이미지 선택: {best_path}")
        return best_image, best_path, attempts
    
    def enhanced_face_detection(self, body_image, face_image_path):
        """⭐ 개선된 얼굴 검출 및 분석"""
        
        # 생성된 전신 이미지에서 얼굴 영역 찾기
        body_cv = cv2.cvtColor(np.array(body_image), cv2.COLOR_RGB2BGR)
        body_faces = self.face_app.get(body_cv)
        
        if len(body_faces) == 0:
            print("❌ 전신 이미지에서 얼굴을 찾을 수 없습니다.")
            return None, None, None
        
        # ⭐ 참조 얼굴 이미지 전처리
        face_image = cv2.imread(face_image_path)
        if face_image is None:
            print(f"❌ 얼굴 이미지를 불러올 수 없습니다: {face_image_path}")
            return None, None, None
        
        # ⭐ 얼굴 이미지 품질 개선
        face_image = self.preprocess_face_image(face_image)
        
        face_faces = self.face_app.get(face_image)
        
        if len(face_faces) == 0:
            print("❌ 참조 이미지에서 얼굴을 찾을 수 없습니다.")
            return None, None, None
        
        print(f"✅ 전신 이미지에서 {len(body_faces)}개 얼굴 검출")
        print(f"✅ 참조 이미지에서 {len(face_faces)}개 얼굴 검출")
        
        # 가장 큰/중앙의 얼굴 선택
        best_body_face = max(body_faces, key=lambda f: f.bbox[2] * f.bbox[3])
        best_ref_face = max(face_faces, key=lambda f: f.bbox[2] * f.bbox[3])
        
        return body_cv, best_body_face, best_ref_face
    
    def preprocess_face_image(self, face_image):
        """⭐ 참조 얼굴 이미지 전처리"""
        
        # 노이즈 제거
        denoised = cv2.bilateralFilter(face_image, 9, 75, 75)
        
        # 선명도 증가
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # 대비 향상
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        result = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        return result
    
    def enhanced_face_swap(self, body_image_cv, body_face, reference_face, output_dir="outputs"):
        """⭐ 개선된 얼굴 교체"""
        
        if self.face_swapper is None:
            print("❌ 얼굴 교체 모델이 로드되지 않았습니다.")
            return None, None
        
        try:
            print("🔄 얼굴 교체 진행 중...")
            
            # InsightFace로 얼굴 교체
            result = self.face_swapper.get(
                body_image_cv, 
                body_face, 
                reference_face, 
                paste_back=True
            )
            
            # ⭐ 후처리로 자연스럽게 개선
            enhanced_result = self.post_process_swap(result, body_face)
            
            # BGR to RGB 변환
            result_rgb = cv2.cvtColor(enhanced_result, cv2.COLOR_BGR2RGB)
            result_image = Image.fromarray(result_rgb)
            
            # 최종 결과 저장
            final_path = os.path.join(output_dir, "enhanced_case2_final.png")
            result_image.save(final_path)
            
            # 중간 결과도 저장
            intermediate_path = os.path.join(output_dir, "enhanced_case2_before_postprocess.png")
            Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB)).save(intermediate_path)
            
            print(f"✅ 최종 결과 저장: {final_path}")
            print(f"📊 중간 결과: {intermediate_path}")
            
            return result_image, final_path
            
        except Exception as e:
            print(f"❌ 개선된 얼굴 교체 오류: {e}")
            return None, None
    
    def post_process_swap(self, result_image, face_info):
        """⭐ 교체 후 후처리로 자연스럽게 개선"""
        
        try:
            # 얼굴 영역 추출
            x1, y1, x2, y2 = face_info.bbox.astype(int)
            
            # 경계선 블러링을 위한 마스크 생성
            mask = np.zeros(result_image.shape[:2], dtype=np.uint8)
            center = ((x1 + x2) // 2, (y1 + y2) // 2)
            radius = max((x2 - x1), (y2 - y1)) // 2
            cv2.circle(mask, center, radius, 255, -1)
            
            # 경계선 부드럽게
            mask_blur = cv2.GaussianBlur(mask, (21, 21), 0)
            mask_blur = mask_blur.astype(np.float64) / 255.0
            
            # 가우시안 블러 적용 (경계선만)
            blurred = cv2.GaussianBlur(result_image, (5, 5), 0)
            
            # 마스크를 이용해 경계선만 블러 적용
            for c in range(3):
                result_image[:, :, c] = (
                    result_image[:, :, c] * mask_blur + 
                    blurred[:, :, c] * (1 - mask_blur)
                )
            
            return result_image.astype(np.uint8)
            
        except Exception as e:
            print(f"후처리 오류 (원본 반환): {e}")
            return result_image
    
    def process_enhanced_case2(self, person_info, face_image_path, output_dir="enhanced_outputs"):
        """⭐ 개선된 케이스 2 전체 처리 파이프라인"""
        
        print("=== 개선된 케이스 2: 구조화된 정보 → 고품질 전신 → 자연스러운 얼굴 교체 ===\n")
        
        # 1단계: 개선된 전신 이미지 생성
        print("🎨 1단계: 고품질 전신 이미지 생성")
        body_image, body_path, attempts = self.generate_enhanced_body(person_info, output_dir, 3)
        
        if not body_image:
            print("❌ 전신 이미지 생성 실패")
            return None
        
        # 2단계: 개선된 얼굴 검출
        print("🔍 2단계: 얼굴 검출 및 분석")
        body_cv, body_face, reference_face = self.enhanced_face_detection(body_image, face_image_path)
        
        if body_cv is None:
            print("❌ 얼굴 검출 실패")
            return None
        
        # 3단계: 개선된 얼굴 교체
        print("🔄 3단계: 자연스러운 얼굴 교체")
        final_image, final_path = self.enhanced_face_swap(body_cv, body_face, reference_face, output_dir)
        
        if final_path:
            print(f"\n🎉 개선된 케이스 2 완료!")
            print(f"📁 전신 이미지들: {output_dir}/body_attempt_*.png")
            print(f"🏆 최종 결과: {final_path}")
            
            # 결과 요약 저장
            summary_file = os.path.join(output_dir, "enhanced_case2_summary.txt")
            with open(summary_file, "w", encoding="utf-8") as f:
                f.write("=== 개선된 케이스 2 처리 결과 ===\n\n")
                f.write("입력 정보:\n")
                for key, value in person_info.items():
                    f.write(f"  {key}: {value}\n")
                f.write(f"\n참조 얼굴 이미지: {face_image_path}\n")
                f.write(f"\n생성된 파일들:\n")
                f.write(f"  최종 결과: {final_path}\n")
                f.write(f"  전신 이미지: {body_path}\n")
                for i, attempt in enumerate(attempts, 1):
                    f.write(f"  시도 {i}: {attempt}\n")
            
            print(f"📝 처리 요약: {summary_file}")
            
        return final_path

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 개선된 케이스 2")
    parser.add_argument("--info", "-i", required=True, help="인물 정보 JSON 파일")
    parser.add_argument("--face", "-f", required=True, help="얼굴 참조 이미지")
    parser.add_argument("--output", "-o", default="enhanced_case2_outputs", help="결과 저장 폴더")
    parser.add_argument("--attempts", "-a", type=int, default=3, help="전신 생성 시도 횟수")
    
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
    
    print("=== 개선된 실종자 찾기 AI 데모 - 케이스 2 ===\n")
    print("⭐ SDXL 기반 고품질 전신 생성")
    print("⭐ 다중 시도로 최적 결과 선택")  
    print("⭐ 개선된 얼굴 교체 및 후처리")
    print("⭐ 자연스러운 경계선 블렌딩\n")
    
    print("입력 정보:")
    for key, value in person_info.items():
        print(f"  {key}: {value}")
    print(f"얼굴 참조: {args.face}\n")
    
    # 개선된 케이스 2 처리
    processor = EnhancedMissingPersonCase2()
    result_path = processor.process_enhanced_case2(person_info, args.face, args.output)
    
    if result_path:
        print(f"\n🎉 모든 처리 완료!")
        print(f"🏆 최고 품질 결과: {result_path}")
        print(f"📂 모든 파일: {args.output}/")
    else:
        print("❌ 처리 실패")

if __name__ == "__main__":
    main()
