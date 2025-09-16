import torch
from diffusers import DiffusionPipeline
from PIL import Image
import os
import argparse
import json
import gc

class MissingPersonCase2GPU:
    def __init__(self):
        """케이스 2: GPU 최적화 버전 - 구조화된 정보 → SDXL 전신 생성"""
        print("GPU 환경 확인 중...")
        
        # GPU 사용 가능성 체크
        if not torch.cuda.is_available():
            print("❌ CUDA를 사용할 수 없습니다. GPU 드라이버를 확인해주세요.")
            exit(1)
        
        self.device = "cuda"
        print(f"✅ GPU 사용: {torch.cuda.get_device_name()}")
        print(f"GPU 메모리: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f}GB")
        
        # GPU 메모리 정리
        torch.cuda.empty_cache()
        
        # SDXL 파이프라인 로드 (GPU 최적화)
        print("SDXL 모델 로딩 중... (GPU 최적화)")
        try:
            self.sdxl_pipeline = DiffusionPipeline.from_pretrained(
                "stabilityai/stable-diffusion-xl-base-1.0",
                torch_dtype=torch.float16,  # 메모리 절약
                use_safetensors=True,
                variant="fp16"
            ).to(self.device)
            
            # 메모리 효율성을 위한 최적화
            self.sdxl_pipeline.enable_attention_slicing()
            self.sdxl_pipeline.enable_model_cpu_offload()  # 필요시 CPU로 오프로드
            
            print("✅ SDXL 모델 로딩 완료!")
            
        except Exception as e:
            print(f"❌ SDXL 로딩 실패: {e}")
            print("더 가벼운 SD 1.5 모델로 대체합니다...")
            
            from diffusers import StableDiffusionPipeline
            self.sdxl_pipeline = StableDiffusionPipeline.from_pretrained(
                "runwayml/stable-diffusion-v1-5",
                torch_dtype=torch.float16
            ).to(self.device)
            print("✅ SD 1.5 모델 로딩 완료!")
        
        print(f"현재 GPU 메모리 사용량: {torch.cuda.memory_allocated() / 1e9:.1f}GB\n")
    
    def create_structured_prompt(self, person_info, face_info=None):
        """구조화된 정보를 고품질 프롬프트로 변환"""
        
        # 기본 정보 추출
        clothing = person_info.get('clothing', '')
        build = person_info.get('build', '')
        hair = person_info.get('hair', '')
        age = person_info.get('age', '')
        gender = person_info.get('gender', '')
        additional = person_info.get('additional_info', '')
        
        # 고품질 SDXL 프롬프트 구성
        prompt_parts = [
            f"professional full body portrait of a {gender}",
            f"{age} years old Korean person",
            f"with {hair}" if hair else "",
            f"{build} body build" if build else "",
            f"wearing {clothing}",
            f"{additional}" if additional else "",
            "standing straight pose, front facing view, neutral expression",
            "studio lighting, clean white background, high resolution",
            "detailed clothing textures, realistic skin, photorealistic",
            "8k uhd, dslr, soft lighting, high quality, film grain",
            "missing person poster style, clear visibility"
        ]
        
        prompt = ", ".join([p for p in prompt_parts if p.strip()])
        
        # 강화된 부정 프롬프트
        negative_prompt = """
        low quality, worst quality, normal quality, lowres, low details, oversaturated, undersaturated, overexposed, underexposed,
        grainy, blurry, bad anatomy, extra limbs, extra fingers, mutated hands, poorly drawn hands, poorly drawn face,
        mutation, deformed, ugly, bad proportions, gross proportions, disfigured, out of frame, extra limbs, malformed limbs,
        missing arms, missing legs, extra arms, extra legs, mutated hands, fused fingers, too many fingers, long neck,
        duplicate, mutilated, mutated, poorly drawn, bad anatomy, cloned face, malformed, distorted, cartoon, anime
        """
        
        return prompt, negative_prompt.strip()
    
    def generate_with_memory_management(self, prompt, negative_prompt, output_path, width=768, height=1024):
        """메모리 관리를 포함한 안전한 이미지 생성"""
        
        print(f"이미지 생성 시작 ({width}x{height})")
        print(f"생성 전 GPU 메모리: {torch.cuda.memory_allocated() / 1e9:.1f}GB")
        
        try:
            # 메모리 정리
            torch.cuda.empty_cache()
            gc.collect()
            
            # 이미지 생성
            with torch.cuda.amp.autocast():  # 혼합 정밀도로 메모리 절약
                image = self.sdxl_pipeline(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    num_inference_steps=25,  # 빠른 생성을 위해 줄임
                    guidance_scale=7.5,
                    width=width,
                    height=height,
                    num_images_per_prompt=1,
                    generator=torch.manual_seed(42)  # 재현 가능
                ).images[0]
            
            # 메모리 정리
            torch.cuda.empty_cache()
            
            image.save(output_path)
            print(f"✅ 이미지 저장: {output_path}")
            print(f"생성 후 GPU 메모리: {torch.cuda.memory_allocated() / 1e9:.1f}GB")
            
            return image
            
        except torch.cuda.OutOfMemoryError:
            print("❌ GPU 메모리 부족! 해상도를 줄여서 재시도합니다.")
            torch.cuda.empty_cache()
            
            # 해상도를 줄여서 재시도
            return self.generate_with_memory_management(
                prompt, negative_prompt, output_path, 
                width=512, height=768
            )
            
        except Exception as e:
            print(f"❌ 이미지 생성 오류: {e}")
            torch.cuda.empty_cache()
            return None
    
    def process_case2_gpu(self, person_info, face_image_path=None, output_dir="outputs"):
        """케이스 2 GPU 최적화 처리"""
        
        print("=== 케이스 2: GPU 최적화 구조화된 정보 → 전신 생성 ===\n")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 입력 정보 출력
        print("🔍 입력 정보:")
        for key, value in person_info.items():
            print(f"  {key}: {value}")
        
        if face_image_path and os.path.exists(face_image_path):
            print(f"  얼굴 참조: {face_image_path}")
        print()
        
        # 프롬프트 생성
        prompt, negative_prompt = self.create_structured_prompt(person_info)
        
        print("🎨 생성 프롬프트:")
        print(f"{prompt}\n")
        
        results = []
        
        # 1. 메인 고해상도 이미지
        print("📸 1단계: 고해상도 메인 이미지 생성")
        main_path = os.path.join(output_dir, "main_high_res.png")
        main_image = self.generate_with_memory_management(
            prompt, negative_prompt, main_path, 768, 1024
        )
        
        if main_image:
            results.append(("메인 이미지", main_path))
        
        # 2. 다양한 변형들 (메모리 여유가 있을 때만)
        try:
            print("🎭 2단계: 변형 이미지들 생성")
            
            # 변형 1: 약간 다른 시드
            var1_path = os.path.join(output_dir, "variation_1.png")
            var1_image = self.sdxl_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=20,
                guidance_scale=8.0,
                width=512, height=768,
                generator=torch.manual_seed(123)
            ).images[0]
            var1_image.save(var1_path)
            results.append(("변형 1", var1_path))
            
            # 메모리 정리
            torch.cuda.empty_cache()
            
            # 변형 2: 다른 guidance scale
            var2_path = os.path.join(output_dir, "variation_2.png")
            var2_image = self.sdxl_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=20,
                guidance_scale=6.5,
                width=512, height=768,
                generator=torch.manual_seed(456)
            ).images[0]
            var2_image.save(var2_path)
            results.append(("변형 2", var2_path))
            
        except torch.cuda.OutOfMemoryError:
            print("⚠️  메모리 부족으로 변형 생성을 건너뜁니다.")
            torch.cuda.empty_cache()
        
        # 최종 메모리 정리
        torch.cuda.empty_cache()
        gc.collect()
        
        print(f"\n✅ 케이스 2 처리 완료!")
        print(f"📁 결과 폴더: {output_dir}")
        print(f"🖼️  생성된 이미지: {len(results)}개")
        
        for name, path in results:
            print(f"  • {name}: {path}")
        
        print(f"\n💡 GPU 메모리 상태:")
        print(f"  사용중: {torch.cuda.memory_allocated() / 1e9:.1f}GB")
        print(f"  예약됨: {torch.cuda.memory_reserved() / 1e9:.1f}GB")
        
        return results

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI - 케이스 2 (GPU 최적화)")
    parser.add_argument("--info", "-i", required=True, help="인물 정보 JSON 파일")
    parser.add_argument("--face", "-f", help="얼굴 참조 이미지 (선택사항)")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    # 입력 파일 확인
    if not os.path.exists(args.info):
        print(f"❌ 정보 파일을 찾을 수 없습니다: {args.info}")
        return
    
    # 인물 정보 로드
    try:
        with open(args.info, 'r', encoding='utf-8') as f:
            person_info = json.load(f)
    except Exception as e:
        print(f"❌ 정보 파일 로드 오류: {e}")
        return
    
    # GPU 버전 케이스 2 처리
    try:
        processor = MissingPersonCase2GPU()
        results = processor.process_case2_gpu(person_info, args.face, args.output)
        
        if results:
            print(f"\n🎉 성공! 총 {len(results)}개 이미지가 생성되었습니다.")
        else:
            print("❌ 이미지 생성에 실패했습니다.")
            
    except KeyboardInterrupt:
        print("\n⚠️  사용자에 의해 중단되었습니다.")
        torch.cuda.empty_cache()
    except Exception as e:
        print(f"❌ 처리 중 오류: {e}")
        torch.cuda.empty_cache()

if __name__ == "__main__":
    main()