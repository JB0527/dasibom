import torch
from transformers import PaliGemmaProcessor, PaliGemmaForConditionalGeneration
from PIL import Image
from diffusers import StableDiffusionPipeline
import os
import argparse

class MissingPersonDemo:
    def __init__(self):
        """케이스 1 데모: CCTV 이미지 → 인상착의 추출 → 몽타주 생성"""
        print("모델 로딩 중...")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"디바이스: {self.device}")
        
        # PaliGemma VQA 모델 로드
        print("PaliGemma VQA 모델 로딩...")
        self.processor = PaliGemmaProcessor.from_pretrained("google/paligemma-3b-mix-224")
        self.vqa_model = PaliGemmaForConditionalGeneration.from_pretrained(
            "google/paligemma-3b-mix-224",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None
        )
        
        # Stable Diffusion 파이프라인 로드
        print("Stable Diffusion 모델 로딩...")
        self.sd_pipeline = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
        ).to(self.device)
        
        print("모델 로딩 완료!\n")
        
    def analyze_person(self, image_path):
        """이미지에서 인물 분석"""
        print(f"이미지 분석 중: {image_path}")
        
        try:
            image = Image.open(image_path).convert('RGB')
            print(f"이미지 크기: {image.size}")
        except Exception as e:
            print(f"이미지 로딩 실패: {e}")
            return None
            
        # 핵심 질문들
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
                # 이미지와 텍스트 처리
                inputs = self.processor(text=question, images=image, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    outputs = self.vqa_model.generate(
                        **inputs,
                        max_length=50,
                        do_sample=True,
                        temperature=0.1
                    )
                
                answer = self.processor.decode(outputs[0], skip_special_tokens=True)
                # 질문 제거하고 답변만 추출
                if question in answer:
                    answer = answer.replace(question, "").strip()
                
                results[question] = answer
                print(f"답변: {answer}\n")
                
            except Exception as e:
                print(f"VQA 오류: {e}")
                results[question] = "분석 실패"
        
        return results
    
    def create_prompt(self, analysis_results):
        """분석 결과를 몽타주 프롬프트로 변환"""
        
        # 핵심 정보 추출
        clothing = analysis_results.get("What is this person wearing?", "")
        top_color = analysis_results.get("What color is their shirt or top?", "")
        bottom = analysis_results.get("What are they wearing on the bottom?", "")
        shoes = analysis_results.get("What kind of shoes do they have?", "")
        accessories = analysis_results.get("Do they have any bag or accessories?", "")
        hair = analysis_results.get("What does their hair look like?", "")
        gender = analysis_results.get("Are they male or female?", "")
        age = analysis_results.get("How old do they look?", "")
        height = analysis_results.get("Are they tall or short?", "")
        
        # 프롬프트 구성
        prompt_parts = [
            f"portrait of a {gender} person" if gender else "portrait of a person",
            f"around {age} years old" if age else "",
            f"with {hair}" if hair else "",
            f"wearing {top_color} top" if top_color else "",
            f"wearing {bottom}" if bottom else "",
            f"wearing {shoes}" if shoes else "",
            f"carrying {accessories}" if accessories and "no" not in accessories.lower() else "",
            "realistic face, detailed portrait, clear features",
            "professional headshot, good lighting, front view"
        ]
        
        prompt = ", ".join([p for p in prompt_parts if p.strip()])
        
        negative_prompt = "blurry, low quality, cartoon, anime, multiple faces, deformed"
        
        return prompt, negative_prompt
    
    def generate_montage(self, analysis_results, output_dir="outputs"):
        """몽타주 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        prompt, negative_prompt = self.create_prompt(analysis_results)
        
        print("=== 몽타주 생성 ===")
        print(f"프롬프트: {prompt}\n")
        
        try:
            image = self.sd_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=30,
                guidance_scale=7.5,
                width=512,
                height=512
            ).images[0]
            
            output_path = os.path.join(output_dir, "montage.png")
            image.save(output_path)
            print(f"몽타주 저장됨: {output_path}")
            
            return image, output_path
            
        except Exception as e:
            print(f"몽타주 생성 오류: {e}")
            return None, None

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 케이스 1")
    parser.add_argument("image_path", help="분석할 CCTV 이미지 경로")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(f"오류: 이미지 파일을 찾을 수 없습니다: {args.image_path}")
        return
    
    print("=== 실종자 찾기 AI 데모 - 케이스 1 ===")
    print("CCTV 이미지만 있는 경우: VQA로 특징 추출 → 몽타주 생성\n")
    
    # 데모 실행
    demo = MissingPersonDemo()
    
    # 1단계: 인물 분석
    print("🔍 1단계: 인물 특징 분석")
    analysis = demo.analyze_person(args.image_path)
    
    if not analysis:
        print("이미지 분석에 실패했습니다.")
        return
    
    # 2단계: 몽타주 생성
    print("🎨 2단계: 몽타주 생성")
    montage, output_path = demo.generate_montage(analysis, args.output)
    
    if montage:
        print(f"\n✅ 완료! 결과는 {output_path}에 저장되었습니다.")
        
        # 분석 결과 저장
        result_file = os.path.join(args.output, "analysis_result.txt")
        with open(result_file, "w", encoding="utf-8") as f:
            f.write("=== 인물 분석 결과 ===\n\n")
            for question, answer in analysis.items():
                f.write(f"Q: {question}\n")
                f.write(f"A: {answer}\n\n")
        
        print(f"분석 결과도 {result_file}에 저장되었습니다.")
    else:
        print("몽타주 생성에 실패했습니다.")

if __name__ == "__main__":
    main()