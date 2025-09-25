import torch
from transformers import PaliGemmaProcessor, PaliGemmaForConditionalGeneration
from PIL import Image, ImageDraw, ImageFont
import os
import argparse
import json
from datetime import datetime

class MissingPersonCase3:
    def __init__(self):
        """
        케이스 3: CCTV + 얼굴 사진이 모두 있지만 개인정보가 불명확한 경우
        VQA로 보완 정보 추출하여 실종자 식별 단서 제공
        """
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
        
        print("모델 로딩 완료!\n")
    
    def analyze_cctv_context(self, cctv_image_path):
        """CCTV 이미지에서 상황 맥락 정보 추출"""
        
        print(f"CCTV 이미지 분석 중: {cctv_image_path}")
        
        try:
            image = Image.open(cctv_image_path).convert('RGB')
        except Exception as e:
            print(f"이미지 로딩 실패: {e}")
            return None
        
        # 상황 맥락 분석을 위한 짧고 명확한 질문들
        context_questions = [
            "What time of day is this?",
            "Indoor or outdoor location?", 
            "What is the weather like?",
            "Are there other people visible?",
            "What buildings are in background?",
            "Any vehicles visible?",
            "What is the lighting condition?",
            "Any signs or text visible?",
            "What season is this?",
            "Is person walking or standing?"
        ]
        
        context_info = {}
        
        for i, question in enumerate(context_questions, 1):
            print(f"상황 분석 {i}/{len(context_questions)}: {question}")
            
            try:
                # 이미지 토큰을 명시적으로 추가
                prompt = f"<image>{question}"
                inputs = self.processor(text=prompt, images=image, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    outputs = self.vqa_model.generate(
                        **inputs,
                        max_new_tokens=30,  # max_length 대신 max_new_tokens 사용
                        temperature=0.1,
                        do_sample=True,
                        pad_token_id=self.processor.tokenizer.eos_token_id
                    )
                
                answer = self.processor.decode(outputs[0], skip_special_tokens=True)
                # 프롬프트 제거하고 답변만 추출
                answer = answer.replace(prompt, "").strip()
                
                context_info[question] = answer
                print(f"답변: {answer}\n")
                
            except Exception as e:
                print(f"분석 오류: {e}")
                context_info[question] = "분석 실패"
        
        return context_info
    
    def analyze_person_details(self, cctv_image_path):
        """CCTV에서 인물의 세부 특징 분석"""
        
        try:
            image = Image.open(cctv_image_path).convert('RGB')
        except Exception as e:
            print(f"이미지 로딩 실패: {e}")
            return None
        
        # 인물 세부 특징을 위한 짧은 질문들
        detail_questions = [
            "How fast is person walking?",
            "What is their posture like?",
            "What are they carrying?",
            "Which direction are they moving?",
            "Are they alone?",
            "Any jewelry or watches?",
            "What facial expression?",
            "Any visible tattoos?",
            "How do clothes fit?",
            "Any hat or head covering?",
            "What footwear type?",
            "Distinctive walking style?",
            "Using mobility aids?",
            "Body language mood?"
        ]
        
        detail_info = {}
        
        for i, question in enumerate(detail_questions, 1):
            print(f"인물 분석 {i}/{len(detail_questions)}: {question}")
            
            try:
                prompt = f"<image>{question}"
                inputs = self.processor(text=prompt, images=image, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    outputs = self.vqa_model.generate(
                        **inputs,
                        max_new_tokens=25,
                        temperature=0.05,  # 더 일관된 답변을 위해 낮춤
                        do_sample=True,
                        pad_token_id=self.processor.tokenizer.eos_token_id
                    )
                
                answer = self.processor.decode(outputs[0], skip_special_tokens=True)
                answer = answer.replace(prompt, "").strip()
                
                detail_info[question] = answer
                print(f"답변: {answer}\n")
                
            except Exception as e:
                print(f"분석 오류: {e}")
                detail_info[question] = "분석 실패"
        
        return detail_info
    
    def generate_identification_clues(self, context_info, detail_info, face_image_path=None):
        """실종자 식별을 위한 종합 단서 생성"""
        
        clues = {
            "timestamp_clues": [],
            "location_clues": [],
            "behavioral_clues": [],
            "physical_clues": [],
            "environmental_clues": []
        }
        
        # 시간 관련 단서
        time_info = context_info.get("What time of day is this?", "")
        weather_info = context_info.get("What is the weather like?", "")
        season_info = context_info.get("What season is this?", "")
        
        if time_info and time_info != "분석 실패" and len(time_info) > 3:
            clues["timestamp_clues"].append(f"촬영 시간대: {time_info}")
        if weather_info and weather_info != "분석 실패" and len(weather_info) > 3:
            clues["timestamp_clues"].append(f"날씨 상태: {weather_info}")
        if season_info and season_info != "분석 실패" and len(season_info) > 3:
            clues["timestamp_clues"].append(f"계절: {season_info}")
        
        # 위치 관련 단서
        location_info = context_info.get("Indoor or outdoor location?", "")
        building_info = context_info.get("What buildings are in background?", "")
        signs_info = context_info.get("Any signs or text visible?", "")
        
        if location_info and location_info != "분석 실패":
            clues["location_clues"].append(f"장소 유형: {location_info}")
        if building_info and building_info != "분석 실패" and len(building_info) > 3:
            clues["location_clues"].append(f"배경 건물: {building_info}")
        if signs_info and signs_info != "분석 실패" and len(signs_info) > 3:
            clues["location_clues"].append(f"표지판/텍스트: {signs_info}")
        
        # 행동 관련 단서
        pace_info = detail_info.get("How fast is person walking?", "")
        posture_info = detail_info.get("What is their posture like?", "")
        direction_info = detail_info.get("Which direction are they moving?", "")
        alone_info = detail_info.get("Are they alone?", "")
        
        if pace_info and pace_info != "분석 실패":
            clues["behavioral_clues"].append(f"보행 속도: {pace_info}")
        if posture_info and posture_info != "분석 실패":
            clues["behavioral_clues"].append(f"자세: {posture_info}")
        if direction_info and direction_info != "분석 실패":
            clues["behavioral_clues"].append(f"이동 방향: {direction_info}")
        if alone_info and alone_info != "분석 실패":
            clues["behavioral_clues"].append(f"동행 여부: {alone_info}")
        
        # 신체적 특징 단서
        carrying_info = detail_info.get("What are they carrying?", "")
        jewelry_info = detail_info.get("Any jewelry or watches?", "")
        footwear_info = detail_info.get("What footwear type?", "")
        
        if carrying_info and carrying_info != "분석 실패" and len(carrying_info) > 3:
            clues["physical_clues"].append(f"소지품: {carrying_info}")
        if jewelry_info and jewelry_info != "분석 실패" and len(jewelry_info) > 3:
            clues["physical_clues"].append(f"액세서리: {jewelry_info}")
        if footwear_info and footwear_info != "분석 실패" and len(footwear_info) > 3:
            clues["physical_clues"].append(f"신발: {footwear_info}")
        
        # 환경적 단서
        people_info = context_info.get("Are there other people visible?", "")
        vehicle_info = context_info.get("Any vehicles visible?", "")
        lighting_info = context_info.get("What is the lighting condition?", "")
        
        if people_info and people_info != "분석 실패":
            clues["environmental_clues"].append(f"주변 인물: {people_info}")
        if vehicle_info and vehicle_info != "분석 실패" and len(vehicle_info) > 3:
            clues["environmental_clues"].append(f"주변 차량: {vehicle_info}")
        if lighting_info and lighting_info != "분석 실패":
            clues["environmental_clues"].append(f"조명 상태: {lighting_info}")
        
        return clues
    
    def create_investigation_report(self, context_info, detail_info, clues, output_dir="outputs"):
        """수사 참고용 종합 보고서 생성"""
        
        os.makedirs(output_dir, exist_ok=True)
        
        report_path = os.path.join(output_dir, "investigation_report_case3.txt")
        
        with open(report_path, "w", encoding="utf-8") as f:
            f.write("=" * 60 + "\n")
            f.write("실종자 식별 보완 정보 보고서 (케이스 3)\n")
            f.write("=" * 60 + "\n")
            f.write(f"생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # 핵심 식별 단서
            f.write("🔍 핵심 식별 단서\n")
            f.write("-" * 30 + "\n")
            for category, clue_list in clues.items():
                if clue_list:
                    category_name = {
                        "timestamp_clues": "⏰ 시간 관련 정보",
                        "location_clues": "📍 위치 관련 정보", 
                        "behavioral_clues": "🚶 행동 패턴 정보",
                        "physical_clues": "👤 신체적 특징",
                        "environmental_clues": "🌍 환경적 맥락"
                    }.get(category, category)
                    
                    f.write(f"\n{category_name}:\n")
                    for clue in clue_list:
                        f.write(f"  • {clue}\n")
            
            # 상세 분석 결과 (분석 성공한 것만)
            f.write(f"\n\n📋 상세 분석 결과\n")
            f.write("-" * 30 + "\n")
            
            f.write("\n🏙️ 상황 맥락 분석:\n")
            for question, answer in context_info.items():
                if answer != "분석 실패" and len(answer.strip()) > 0:
                    f.write(f"Q: {question}\n")
                    f.write(f"A: {answer}\n\n")
            
            f.write("\n👤 인물 세부 특징 분석:\n")
            for question, answer in detail_info.items():
                if answer != "분석 실패" and len(answer.strip()) > 0:
                    f.write(f"Q: {question}\n")
                    f.write(f"A: {answer}\n\n")
            
            # 수사 권고사항
            f.write("💡 수사 권고사항\n")
            f.write("-" * 30 + "\n")
            f.write("1. 위 식별된 시간대와 위치 정보를 활용하여 추가 CCTV 수집\n")
            f.write("2. 행동 패턴 정보를 바탕으로 유사한 케이스와 비교 분석\n")
            f.write("3. 환경적 맥락 정보를 활용하여 실종 경위 추정\n")
            f.write("4. 신체적 특징 정보로 목격자 진술과 대조\n\n")
        
        print(f"수사 보고서가 {report_path}에 저장되었습니다.")
        return report_path

def main():
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 케이스 3 (수정판)")
    parser.add_argument("cctv_image", help="분석할 CCTV 이미지 경로")
    parser.add_argument("--face", "-f", help="얼굴 참조 이미지 (선택사항)")
    parser.add_argument("--known", "-k", help="기존 알려진 정보 JSON 파일 (선택사항)")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.cctv_image):
        print(f"오류: CCTV 이미지를 찾을 수 없습니다: {args.cctv_image}")
        return
    
    print("=== 실종자 찾기 AI 데모 - 케이스 3 (수정판) ===")
    print("CCTV + 얼굴 사진이 있지만 개인정보가 불명확한 경우")
    print("VQA로 보완 정보 추출하여 실종자 식별 단서 제공\n")
    
    # 케이스 3 처리
    processor = MissingPersonCase3()
    
    # 1단계: CCTV 상황 맥락 분석
    print("🏙️ 1단계: CCTV 상황 맥락 분석")
    context_info = processor.analyze_cctv_context(args.cctv_image)
    
    if not context_info:
        print("상황 맥락 분석에 실패했습니다.")
        return
    
    # 2단계: 인물 세부 특징 분석
    print("👤 2단계: 인물 세부 특징 분석")
    detail_info = processor.analyze_person_details(args.cctv_image)
    
    if not detail_info:
        print("인물 세부 분석에 실패했습니다.")
        return
    
    # 3단계: 식별 단서 생성
    print("💡 3단계: 식별 단서 생성")
    clues = processor.generate_identification_clues(context_info, detail_info, args.face)
    
    # 4단계: 수사 보고서 생성
    print("📋 4단계: 수사 보고서 생성")
    report_path = processor.create_investigation_report(context_info, detail_info, clues, args.output)
    
    print(f"\n✅ 케이스 3 처리 완료!")
    print(f"📄 수사 보고서: {report_path}")
    
    # 핵심 단서 요약 출력 (유효한 단서만)
    print("\n🔍 핵심 식별 단서 요약:")
    total_clues = 0
    for category, clue_list in clues.items():
        if clue_list:
            category_name = {
                "timestamp_clues": "⏰ 시간 정보",
                "location_clues": "📍 위치 정보", 
                "behavioral_clues": "🚶 행동 패턴",
                "physical_clues": "👤 신체 특징",
                "environmental_clues": "🌍 환경 맥락"
            }.get(category, category)
            print(f"\n{category_name}: {len(clue_list)}개")
            for clue in clue_list[:2]:  # 상위 2개만 출력
                print(f"  • {clue}")
            total_clues += len(clue_list)
    
    print(f"\n📊 총 {total_clues}개의 유용한 단서가 발견되었습니다.")

if __name__ == "__main__":
    main()