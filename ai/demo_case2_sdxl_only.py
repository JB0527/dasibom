import torch
from diffusers import DiffusionPipeline
from PIL import Image
import os
import argparse
import json

class MissingPersonCase2Simple:
    def __init__(self):
        """케이스 2 간소화: 구조화된 정보 → SDXL 전신 생성 (얼굴 교체 없이)"""
        print("SDXL 모델 로딩 중...")
        
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
        
        print("모델 로딩 완료!\n")
    
    def create_structured_prompt(self, person_info, face_info=None):
        """구조화된 정보를 SDXL 프롬프트로 변환"""
        
        # 기본 정보 추출
        clothing = person_info.get('clothing', '')
        build = person_info.get('build', '')
        hair = person_info.get('hair', '')
        age = person_info.get('age', '')
        gender = person_info.get('gender', '')
        additional = person_info.get('additional_info', '')
        
        # 얼굴 정보가 있다면 통합
        if face_info:
            hair = face_info.get('hair', hair)
            age = face_info.get('age', age)
            gender = face_info.get('gender', gender)
        
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
            "high resolution, detailed clothing, realistic face, photorealistic",
            "clear facial features, detailed portrait, missing person poster style"
        ]
        
        prompt = ", ".join([p for p in prompt_parts if p.strip()])
        
        # 부정 프롬프트 (품질 개선용)
        negative_prompt = """
        low quality, cartoon, anime, drawing, painting,
        multiple people, cropped, bad anatomy, deformed,
        dark lighting, blurry, distorted, ugly
        """
        
        return prompt, negative_prompt.strip()
    
    def generate_full_body_image(self, person_info, face_info=None, output_dir="outputs"):
        """전신 이미지 생성 (얼굴 포함)"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_structured_prompt(person_info, face_info)
        
        print("=== 전신 이미지 생성 ===")
        print(f"프롬프트: {prompt}\n")
        
        try:
            # SDXL로 전신 이미지 생성 (얼굴 포함)
            image = self.sdxl_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=30,
                guidance_scale=8.0,
                width=768,
                height=1024,  # 전신이므로 세로로 길게
                num_images_per_prompt=1
            ).images[0]
            
            result_path = os.path.join(output_dir, "sdxl_full_body_case2.png")
            image.save(result_path)
            print(f"전신 이미지 저장: {result_path}")
            
            return image, result_path
            
        except Exception as e:
            print(f"이미지 생성 오류: {e}")
            return None, None
    
    def generate_multiple_variations(self, person_info, face_info=None, output_dir="outputs", num_variations=3):
        """다양한 변형 이미지 생성"""
        
        prompt, negative_prompt = self.create_structured_prompt(person_info, face_info)
        
        print(f"=== {num_variations}가지 변형 이미지 생성 ===")
        
        results = []
        
        for i in range(num_variations):
            print(f"변형 {i+1}/{num_variations} 생성 중...")
            
            try:
                # 각 변형마다 약간씩 다른 설정
                guidance_scales = [7.5, 8.0, 8.5]
                steps = [25, 30, 35]
                
                image = self.sdxl_pipeline(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=steps[i % len(steps)],
                    guidance_scale=guidance_scales[i % len(guidance_scales)],
                    width=768,
                    height=1024,
                    num_images_per_prompt=1,
                    generator=torch.manual_seed(42 + i)  # 재현 가능한 결과
                ).images[0]
                
                result_path = os.path.join(output_dir, f"sdxl_variation_{i+1}_case2.png")
                image.save(result_path)
                results.append((image, result_path))
                print(f"변형 {i+1} 저장: {result_path}")
                
            except Exception as e:
                print(f"변형 {i+1} 생성 오류: {e}")
                continue
        
        return results
    
    def process_case2_simple(self, person_info, face_image_path=None, output_dir="outputs"):
        """케이스 2 간소화 처리 파이프라인"""
        
        print("=== 케이스 2 (SDXL 전용): 구조화된 정보 → 전신 생성 ===\n")
        
        face_info = None
        
        # 얼굴 이미지가 있다면 간단한 정보 추가 (실제로는 VQA로 분석 가능)
        if face_image_path and os.path.exists(face_image_path):
            print(f"참조 얼굴 이미지: {face_image_path}")
            face_info = {
                "reference_available": True,
                "note": "얼굴 참조 이미지 제공됨 - 프롬프트에 반영"
            }
        
        # 1단계: 기본 전신 이미지 생성
        print("🎨 1단계: 기본 전신 이미지 생성")
        main_image, main_path = self.generate_full_body_image(person_info, face_info, output_dir)
        
        if not main_image:
            return None
        
        # 2단계: 다양한 변형 생성
        print("🎨 2단계: 다양한 변형 이미지 생성")
        variations = self.generate_multiple_variations(person_info, face_info, output_dir, num_variations=3)
        
        print(f"\n✅ 케이스 2 (SDXL 전용) 처리 완료!")
        print(f"📁 결과 폴더: {output_dir}")
        print(f"🖼️  메인 이미지: {main_path}")
        print(f"🎭 변형 이미지: {len(variations)}개")
        
        return {
            "main_image": main_path,
            "variations": [path for _, path in variations]
        }

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 케이스 2 (SDXL 전용)")
    parser.add_argument("--info", "-i", required=True, help="인물 정보 JSON 파일")
    parser.add_argument("--face", "-f", help="얼굴 참조 이미지 (선택사항)")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    # 입력 파일 확인
    if not os.path.exists(args.info):
        print(f"오류: 정보 파일을 찾을 수 없습니다: {args.info}")
        return
    
    if args.face and not os.path.exists(args.face):
        print(f"경고: 얼굴 이미지를 찾을 수 없습니다: {args.face}")
        args.face = None
    
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
    
    # 케이스 2 처리 (SDXL 전용)
    processor = MissingPersonCase2Simple()
    results = processor.process_case2_simple(person_info, args.face, args.output)
    
    if results:
        print(f"\n🎉 완료! 결과 파일들:")
        print(f"  메인: {results['main_image']}")
        for i, var_path in enumerate(results['variations'], 1):
            print(f"  변형 {i}: {var_path}")
        
        print(f"\n💡 다음 단계:")
        print(f"1. 생성된 이미지들을 확인하세요")
        print(f"2. 가장 만족스러운 결과를 선택하세요") 
        print(f"3. 필요시 JSON 정보를 수정하고 다시 생성하세요")
    else:
        print("❌ 처리 실패")

if __name__ == "__main__":
    main()