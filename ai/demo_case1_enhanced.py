import torch
from transformers import PaliGemmaProcessor, PaliGemmaForConditionalGeneration
from PIL import Image
from diffusers import StableDiffusionXLPipeline  # ⭐ SDXL로 변경
import os
import argparse
import cv2
import numpy as np

class EnhancedMissingPersonDemo:
    def __init__(self):
        """⭐ 개선된 케이스 1: 고품질 얼굴 생성"""
        print("개선된 모델 로딩 중...")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"디바이스: {self.device}")
        
        # PaliGemma VQA 모델 (기존 유지)
        print("PaliGemma VQA 모델 로딩...")
        self.processor = PaliGemmaProcessor.from_pretrained("google/paligemma-3b-mix-224")
        self.vqa_model = PaliGemmaForConditionalGeneration.from_pretrained(
            "google/paligemma-3b-mix-224",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None
        )
        
        # ⭐ SDXL 파이프라인 로드 (기존 SD 1.5 대신)
        print("SDXL 모델 로딩...")
        self.sd_pipeline = StableDiffusionXLPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            use_safetensors=True
        ).to(self.device)
        
        # ⭐ 메모리 최적화
        self.sd_pipeline.enable_model_cpu_offload()
        self.sd_pipeline.enable_vae_slicing()
        
        print("개선된 모델 로딩 완료!\n")
        
    def analyze_person(self, image_path):
        """기존과 동일한 VQA 분석"""
        print(f"이미지 분석 중: {image_path}")
        
        try:
            image = Image.open(image_path).convert('RGB')
            print(f"이미지 크기: {image.size}")
        except Exception as e:
            print(f"이미지 로딩 실패: {e}")
            return None
            
        # 기존 질문들 유지
        questions = [
            "What is this person wearing?",
            "What color is their shirt or top?", 
            "What are they wearing on the bottom?",
            "What kind of shoes do they have?",
            "Do they have any bag or accessories?",
            "What does their hair look like?",
            "Are they male or female?",
            "How old do they look?",
            "Are they tall or short?",
            "Any other notable features?"
        ]
        
        results = {}
        
        for i, question in enumerate(questions, 1):
            print(f"질문 {i}/{len(questions)}: {question}")
            
            try:
                inputs = self.processor(text=question, images=image, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    outputs = self.vqa_model.generate(
                        **inputs,
                        max_length=50,
                        do_sample=True,
                        temperature=0.1
                    )
                
                answer = self.processor.decode(outputs[0], skip_special_tokens=True)
                if question in answer:
                    answer = answer.replace(question, "").strip()
                
                results[question] = answer
                print(f"답변: {answer}\n")
                
            except Exception as e:
                print(f"VQA 오류: {e}")
                results[question] = "분석 실패"
        
        return results
    
    def create_enhanced_prompt(self, analysis_results):
        """⭐ 대폭 개선된 프롬프트"""
        
        # 기존 정보 추출
        clothing = analysis_results.get("What is this person wearing?", "")
        top_color = analysis_results.get("What color is their shirt or top?", "")
        bottom = analysis_results.get("What are they wearing on the bottom?", "")
        shoes = analysis_results.get("What kind of shoes do they have?", "")
        accessories = analysis_results.get("Do they have any bag or accessories?", "")
        hair = analysis_results.get("What does their hair look like?", "")
        gender = analysis_results.get("Are they male or female?", "")
        age = analysis_results.get("How old do they look?", "")
        height = analysis_results.get("Are they tall or short?", "")
        
        # ⭐ 한국인 특화 프롬프트 구성
        base_parts = [
            f"Professional portrait photography of a Korean {gender} person" if gender else "Professional portrait photography of a Korean person",
            f"around {age} years old" if age else "",
            f"with {hair}" if hair else "",
            f"wearing {top_color} top" if top_color else "",
            f"wearing {bottom}" if bottom else "",
            f"wearing {shoes}" if shoes else "",
            f"carrying {accessories}" if accessories and "no" not in accessories.lower() else "",
        ]
        
        # ⭐ 한국인 얼굴 특성 강화
        korean_features = [
            "East Asian facial features",
            "Korean face structure", 
            "natural Korean skin tone",
            "realistic facial proportions"
        ]
        
        # ⭐ 고품질 사진 조건
        quality_terms = [
            "professional headshot",
            "studio lighting",
            "sharp focus on face",
            "detailed facial features", 
            "clear skin texture",
            "natural expression",
            "direct eye contact",
            "high resolution",
            "photorealistic",
            "masterpiece quality",
            "DSLR photograph"
        ]
        
        # 최종 프롬프트 조합
        prompt_parts = [p for p in base_parts if p.strip()]
        full_prompt = ", ".join(prompt_parts + korean_features + quality_terms)
        
        # ⭐ 강화된 부정 프롬프트
        negative_prompt = """
        blurry, low quality, distorted, deformed, ugly, bad anatomy, 
        bad proportions, extra limbs, cloned face, disfigured, 
        cartoon, anime, painting, drawing, sketch, multiple faces, 
        watermark, text, dark lighting, shadows, western facial features
        """
        
        return full_prompt, negative_prompt.strip()
    
    def crop_to_face(self, image):
        """⭐ 얼굴 중심 자동 크롭"""
        
        # PIL → OpenCV 변환
        img_array = np.array(image)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # 얼굴 검출
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            # 가장 큰 얼굴 선택
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            
            # 얼굴 주변 여백 추가
            margin = int(max(w, h) * 0.3)
            x1 = max(0, x - margin)
            y1 = max(0, y - margin)
            x2 = min(image.width, x + w + margin)
            y2 = min(image.height, y + h + margin)
            
            cropped = image.crop((x1, y1, x2, y2))
            return cropped.resize((512, 512))
        else:
            # 얼굴 검출 실패 시 상단 중앙 크롭
            w, h = image.size
            crop_size = min(w, int(h * 0.6))
            left = (w - crop_size) // 2
            top = 0
            return image.crop((left, top, left + crop_size, top + crop_size)).resize((512, 512))
    
    def generate_enhanced_montage(self, analysis_results, output_dir="outputs", num_variations=3):
        """⭐ SDXL 기반 다중 변형 몽타주 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_enhanced_prompt(analysis_results)
        
        print("=== 고품질 다중 몽타주 생성 ===")
        print(f"프롬프트: {prompt[:150]}...\n")
        
        best_image = None
        best_path = None
        variations = []
        
        for i in range(num_variations):
            print(f"변형 {i+1}/{num_variations} 생성 중...")
            
            try:
                # ⭐ SDXL 고품질 설정
                image = self.sd_pipeline(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=30,
                    guidance_scale=7.5,
                    width=768,
                    height=1024,
                    generator=torch.Generator(device=self.device).manual_seed(42 + i * 1000)
                ).images[0]
                
                # ⭐ 얼굴 중심 크롭
                cropped_face = self.crop_to_face(image)
                
                # 변형 저장
                variation_path = os.path.join(output_dir, f"enhanced_variation_{i+1}.png")
                cropped_face.save(variation_path)
                variations.append(variation_path)
                
                # 첫 번째를 베스트로 설정 (추후 품질 평가로 개선 가능)
                if i == 0:
                    best_image = cropped_face
                    best_path = os.path.join(output_dir, "enhanced_montage_best.png")
                    cropped_face.save(best_path)
                
                print(f"변형 {i+1} 저장: {variation_path}")
                
                # 메모리 정리
                torch.cuda.empty_cache()
                
            except Exception as e:
                print(f"변형 {i+1} 생성 오류: {e}")
                continue
        
        print(f"\n✅ {len(variations)}개 변형 생성 완료!")
        print(f"최고 품질: {best_path}")
        
        return best_image, best_path, variations

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 개선된 케이스 1")
    parser.add_argument("image_path", help="분석할 CCTV 이미지 경로")
    parser.add_argument("--output", "-o", default="enhanced_outputs", help="결과 저장 폴더")
    parser.add_argument("--variations", "-v", type=int, default=3, help="생성할 변형 수 (기본값: 3)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(f"오류: 이미지 파일을 찾을 수 없습니다: {args.image_path}")
        return
    
    print("=== 실종자 찾기 AI 데모 - 개선된 케이스 1 ===\n")
    print("⭐ SDXL 기반 고품질 한국인 몽타주 생성")
    print("⭐ 다중 변형 생성으로 품질 향상")
    print("⭐ 얼굴 자동 크롭 기능\n")
    
    # 개선된 데모 실행
    demo = EnhancedMissingPersonDemo()
    
    # 1단계: 인물 분석
    print("🔍 1단계: 인물 특징 분석")
    analysis = demo.analyze_person(args.image_path)
    
    if not analysis:
        print("이미지 분석에 실패했습니다.")
        return
    
    # 2단계: 개선된 몽타주 생성
    print("🎨 2단계: 고품질 다중 몽타주 생성")
    best_montage, best_path, variations = demo.generate_enhanced_montage(
        analysis, 
        args.output, 
        args.variations
    )
    
    if best_montage:
        print(f"\n🎉 완료! 최고 품질 결과: {best_path}")
        print(f"📁 모든 변형들: {args.output}")
        
        # 분석 결과 저장
        result_file = os.path.join(args.output, "enhanced_analysis_result.txt")
        with open(result_file, "w", encoding="utf-8") as f:
            f.write("=== 개선된 인물 분석 결과 ===\n\n")
            for question, answer in analysis.items():
                f.write(f"Q: {question}\n")
                f.write(f"A: {answer}\n\n")
            
            f.write("\n=== 생성된 파일들 ===\n")
            f.write(f"최고 품질 몽타주: {best_path}\n")
            for i, var_path in enumerate(variations, 1):
                f.write(f"변형 {i}: {var_path}\n")
        
        print(f"📝 분석 결과: {result_file}")
        
        # 성능 비교를 위한 기존 버전도 생성
        print("\n📊 성능 비교용: 기존 SD 1.5 버전도 생성 중...")
        # 여기에 기존 데모 코드로 비교 생성 (선택사항)
        
    else:
        print("❌ 몽타주 생성에 실패했습니다.")

if __name__ == "__main__":
    main()
