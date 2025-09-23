import torch
from PIL import Image
import cv2
import numpy as np
from diffusers import StableDiffusionUpscalePipeline
from transformers import pipeline
import os
import argparse
from datetime import datetime

class CCTVSuperResolution:
    def __init__(self):
        """
        저화질 CCTV 이미지를 고화질로 업스케일링
        다양한 Super Resolution 모델 지원
        """
        print("Super Resolution 모델 로딩 중...")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"디바이스: {self.device}")
        
        # 1. Stable Diffusion Upscaler (4x)
        print("Stable Diffusion 업스케일러 로딩...")
        self.sd_upscaler = StableDiffusionUpscalePipeline.from_pretrained(
            "stabilityai/stable-diffusion-x4-upscaler",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
        ).to(self.device)
        
        # 2. Real-ESRGAN (허깅페이스)
        print("Real-ESRGAN 모델 로딩...")
        try:
            self.esrgan_upscaler = pipeline(
                "image-to-image",
                model="ai-forever/Real-ESRGAN",
                device=0 if self.device == "cuda" else -1
            )
        except Exception as e:
            print(f"Real-ESRGAN 로딩 실패: {e}")
            self.esrgan_upscaler = None
        
        print("모델 로딩 완료!\n")
    
    def preprocess_cctv_image(self, image_path):
        """CCTV 이미지 전처리"""
        
        print(f"이미지 전처리 중: {image_path}")
        
        try:
            # PIL로 이미지 로드
            image = Image.open(image_path).convert('RGB')
            original_size = image.size
            print(f"원본 크기: {original_size}")
            
            # OpenCV로도 로드 (노이즈 제거용)
            cv_image = cv2.imread(image_path)
            cv_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
            
            # 1. 노이즈 제거 (가우시안 블러 + 샤프닝)
            denoised = cv2.GaussianBlur(cv_image, (3, 3), 0)
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharpened = cv2.filter2D(denoised, -1, kernel)
            
            # 2. 대비 개선 (CLAHE)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            lab = cv2.cvtColor(sharpened, cv2.COLOR_RGB2LAB)
            lab[:,:,0] = clahe.apply(lab[:,:,0])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            
            # PIL로 변환
            preprocessed_image = Image.fromarray(enhanced)
            
            print("이미지 전처리 완료")
            return image, preprocessed_image
            
        except Exception as e:
            print(f"전처리 오류: {e}")
            return None, None
    
    def upscale_with_stable_diffusion(self, image, prompt="high quality CCTV footage, clear details, enhanced resolution"):
        """Stable Diffusion 업스케일러로 4배 확대"""
        
        print("Stable Diffusion 업스케일링 중... (4배 확대)")
        
        try:
            # 이미지 크기가 너무 크면 resize
            if max(image.size) > 512:
                ratio = 512 / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                print(f"입력 크기 조정: {new_size}")
            
            upscaled = self.sd_upscaler(
                prompt=prompt,
                image=image,
                num_inference_steps=20,
                guidance_scale=0,  # 0으로 설정하면 더 자연스러움
            ).images[0]
            
            print(f"SD 업스케일링 완료: {upscaled.size}")
            return upscaled
            
        except Exception as e:
            print(f"SD 업스케일링 오류: {e}")
            return None
    
    def upscale_with_esrgan(self, image):
        """Real-ESRGAN으로 업스케일링"""
        
        if not self.esrgan_upscaler:
            print("Real-ESRGAN 모델을 사용할 수 없습니다.")
            return None
        
        print("Real-ESRGAN 업스케일링 중...")
        
        try:
            # 허깅페이스 파이프라인 사용
            upscaled = self.esrgan_upscaler(image)
            
            if isinstance(upscaled, list):
                upscaled = upscaled[0]
            
            print(f"ESRGAN 업스케일링 완료: {upscaled.size}")
            return upscaled
            
        except Exception as e:
            print(f"ESRGAN 업스케일링 오류: {e}")
            return None
    
    def traditional_upscale(self, image, scale_factor=4):
        """전통적인 보간법으로 업스케일링 (비교용)"""
        
        print(f"전통적인 업스케일링 중... ({scale_factor}배)")
        
        try:
            new_size = (image.size[0] * scale_factor, image.size[1] * scale_factor)
            
            # 여러 보간법 시도
            methods = {
                'lanczos': Image.Resampling.LANCZOS,
                'bicubic': Image.Resampling.BICUBIC,
                'nearest': Image.Resampling.NEAREST
            }
            
            results = {}
            for name, method in methods.items():
                upscaled = image.resize(new_size, method)
                results[name] = upscaled
                print(f"{name} 완료: {upscaled.size}")
            
            return results['lanczos'], results  # 기본으로 Lanczos 반환
            
        except Exception as e:
            print(f"전통적인 업스케일링 오류: {e}")
            return None, {}
    
    def face_specific_enhancement(self, image):
        """얼굴 영역에 특화된 개선"""
        
        print("얼굴 영역 특화 개선 중...")
        
        try:
            # OpenCV로 변환
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # 얼굴 검출
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) > 0:
                print(f"{len(faces)}개 얼굴 검출됨")
                
                for (x, y, w, h) in faces:
                    # 얼굴 영역 추출
                    face_roi = cv_image[y:y+h, x:x+w]
                    
                    # 얼굴 영역에 특별한 처리
                    # 1. 선명화
                    kernel = np.array([[0,-1,0], [-1,5,-1], [0,-1,0]])
                    sharpened_face = cv2.filter2D(face_roi, -1, kernel)
                    
                    # 2. 대비 개선
                    alpha = 1.2  # 대비
                    beta = 10    # 밝기
                    enhanced_face = cv2.convertScaleAbs(sharpened_face, alpha=alpha, beta=beta)
                    
                    # 원본에 다시 적용
                    cv_image[y:y+h, x:x+w] = enhanced_face
                
                # BGR to RGB 변환
                result = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
                enhanced_image = Image.fromarray(result)
                
                print("얼굴 특화 개선 완료")
                return enhanced_image
            else:
                print("얼굴을 찾을 수 없어 일반 개선을 적용합니다.")
                return image
                
        except Exception as e:
            print(f"얼굴 특화 개선 오류: {e}")
            return image
    
    def compare_results(self, original, results_dict, output_dir="outputs"):
        """다양한 방법들의 결과 비교"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 비교 이미지 생성
        comparison_width = 800
        comparison_height = 600
        
        # 원본과 결과들을 같은 크기로 리사이즈
        resized_original = original.resize((comparison_width, comparison_height), Image.Resampling.LANCZOS)
        
        comparison_images = [("원본", resized_original)]
        
        for name, result in results_dict.items():
            if result is not None:
                resized_result = result.resize((comparison_width, comparison_height), Image.Resampling.LANCZOS)
                comparison_images.append((name, resized_result))
        
        # 비교 이미지 저장
        comparison_path = os.path.join(output_dir, "super_resolution_comparison.png")
        
        # 간단한 그리드 생성 (2x2 또는 1x4)
        if len(comparison_images) <= 4:
            cols = min(2, len(comparison_images))
            rows = (len(comparison_images) + cols - 1) // cols
            
            grid_width = comparison_width * cols
            grid_height = comparison_height * rows + 50 * rows  # 텍스트 공간
            
            grid = Image.new('RGB', (grid_width, grid_height), 'white')
            
            for idx, (name, img) in enumerate(comparison_images):
                row = idx // cols
                col = idx % cols
                
                x = col * comparison_width
                y = row * (comparison_height + 50)
                
                grid.paste(img, (x, y))
                
                # 텍스트는 간단히 파일명으로 저장
                # (실제로는 PIL의 ImageDraw를 사용해야 함)
            
            grid.save(comparison_path)
            print(f"비교 이미지 저장: {comparison_path}")
    
    def process_cctv_image(self, image_path, methods=['all'], output_dir="outputs"):
        """CCTV 이미지 종합 처리"""
        
        print("=== CCTV 이미지 Super Resolution 처리 ===\n")
        
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. 이미지 전처리
        original, preprocessed = self.preprocess_cctv_image(image_path)
        if not original:
            return None
        
        # 전처리된 이미지 저장
        preprocessed_path = os.path.join(output_dir, "01_preprocessed.png")
        preprocessed.save(preprocessed_path)
        
        results = {}
        
        # 2. 각 방법별 처리
        if 'all' in methods or 'stable_diffusion' in methods:
            print("📈 Stable Diffusion 업스케일링")
            sd_result = self.upscale_with_stable_diffusion(preprocessed)
            if sd_result:
                sd_path = os.path.join(output_dir, "02_stable_diffusion_4x.png")
                sd_result.save(sd_path)
                results['Stable Diffusion 4x'] = sd_result
        
        if 'all' in methods or 'esrgan' in methods:
            print("📈 Real-ESRGAN 업스케일링")
            esrgan_result = self.upscale_with_esrgan(preprocessed)
            if esrgan_result:
                esrgan_path = os.path.join(output_dir, "03_real_esrgan.png")
                esrgan_result.save(esrgan_path)
                results['Real-ESRGAN'] = esrgan_result
        
        if 'all' in methods or 'traditional' in methods:
            print("📈 전통적인 업스케일링")
            traditional_result, traditional_variants = self.traditional_upscale(preprocessed)
            if traditional_result:
                traditional_path = os.path.join(output_dir, "04_traditional_lanczos_4x.png")
                traditional_result.save(traditional_path)
                results['Traditional (Lanczos)'] = traditional_result
        
        # 3. 얼굴 특화 개선 (가장 좋은 결과에 적용)
        if results:
            print("👤 얼굴 특화 개선 적용")
            # SD 결과가 있으면 그것을, 없으면 첫 번째 결과 사용
            best_result = results.get('Stable Diffusion 4x', list(results.values())[0])
            face_enhanced = self.face_specific_enhancement(best_result)
            
            face_enhanced_path = os.path.join(output_dir, "05_final_face_enhanced.png")
            face_enhanced.save(face_enhanced_path)
            results['최종 (얼굴 개선)'] = face_enhanced
        
        # 4. 결과 비교
        print("📊 결과 비교 생성")
        self.compare_results(original, results, output_dir)
        
        return results

def main():
    parser = argparse.ArgumentParser(description="CCTV 이미지 Super Resolution")
    parser.add_argument("image_path", help="처리할 저화질 CCTV 이미지")
    parser.add_argument("--methods", "-m", nargs='+', 
                       choices=['all', 'stable_diffusion', 'esrgan', 'traditional'],
                       default=['all'], help="사용할 업스케일링 방법")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(f"오류: 이미지 파일을 찾을 수 없습니다: {args.image_path}")
        return
    
    print(f"입력 이미지: {args.image_path}")
    print(f"사용 방법: {args.methods}")
    print()
    
    # Super Resolution 처리
    processor = CCTVSuperResolution()
    results = processor.process_cctv_image(args.image_path, args.methods, args.output)
    
    if results:
        print(f"\n✅ 처리 완료! 결과는 {args.output} 폴더에 저장되었습니다.")
        print("\n📋 생성된 파일:")
        print("  01_preprocessed.png - 전처리된 이미지")
        if 'Stable Diffusion 4x' in results:
            print("  02_stable_diffusion_4x.png - SD 4배 업스케일")
        if 'Real-ESRGAN' in results:
            print("  03_real_esrgan.png - Real-ESRGAN 결과")  
        if 'Traditional (Lanczos)' in results:
            print("  04_traditional_lanczos_4x.png - 전통적 업스케일")
        if '최종 (얼굴 개선)' in results:
            print("  05_final_face_enhanced.png - 최종 얼굴 개선 결과")
        print("  super_resolution_comparison.png - 결과 비교")
        
        print(f"\n🎯 권장: 최종 얼굴 개선 결과를 케이스 1~3에서 사용하세요!")
    else:
        print("❌ 처리 실패")

if __name__ == "__main__":
    main()