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
        
        # 상황 맥락 분석을 위한 질문들
        context_questions = [
            "What time of day does this appear to be taken?",
            "What kind of location is this? Indoor or outdoor?", 
            "What is the weather condition like?",
            "Are there any other people visible in the image?",
            "What kind of building or area is in the background?",
            "Are there any vehicles visible?",
            "What is the lighting condition?",
            "Are there any signs or text visible?",
            "What season does this appear to be?",
            "Is this person walking, standing, or sitting?"
        ]
        
        context_info = {}
        
        for question in context_questions:
            try:
                inputs = self.processor(text=question, images=image, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    outputs = self.vqa_model.generate(
                        **inputs,
                        max_length=80,
                        temperature=0.2,
                        do_sample=True
                    )
                
                answer = self.processor.decode(outputs[0], skip_special_tokens=True)
                if question in answer:
                    answer = answer.replace(question, "").strip()
                
                context_info[question] = answer
                print(f"Q: {question}")
                print(f"A: {answer}\n")
                
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
        
        # 인물 세부 특징 질문들
        detail_questions = [
            "How is this person walking? Fast, slow, or normal pace?",
            "What is their posture like? Straight, slouched, or hunched?",
            "Are they carrying anything in their hands?",
            "Which direction are they facing or moving?",
            "Do they appear to be alone or with someone?",
            "Are they wearing any jewelry or watches?",
            "What kind of expression can you see?",
            "Are there any visible tattoos or marks?",
            "How do their clothes fit? Loose, tight, or normal?",
            "Are they wearing any hat or head covering?",
            "What kind of footwear are they wearing?",
            "Do they have any distinctive walking style?",
            "Are they using any mobility aids?",
            "What is their approximate body language conveying?"
        ]
        
        detail_info = {}
        
        for question in detail_questions:
            try:
                inputs = self.processor(text=question, images=image, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    outputs = self.vqa_model.generate(
                        **inputs,
                        max_length=60,
                        temperature=0.1,
                        do_sample=True
                    )
                
                answer = self.processor.decode(outputs[0], skip_special_tokens=True)
                if question in answer:
                    answer = answer.replace(question, "").strip()
                
                detail_info[question] = answer
                print(f"Q: {question}")
                print(f"A: {answer}\n")
                
            except Exception as e:
                print(f"분석 오류: {e}")
                detail_info[question] = "분석 실패"
        
        return detail_info
    
    def compare_with_known_info(self, extracted_info, known_info=None):
        """추출된 정보와 기존 알려진 정보 비교"""
        
        if not known_info:
            known_info = {}
        
        comparison = {
            "new_insights": [],
            "confirmations": [],
            "contradictions": []
        }
        
        # 새로운 정보 식별
        for category, info_dict in extracted_info.items():
            for question, answer in info_dict.items():
                if answer not in ["분석 실패", ""] and answer.lower() not in ["no", "none", "unknown"]:
                    
                    insight_key = f"{category}: {question}"
                    insight_value = answer
                    
                    # 기존 정보와 비교
                    if insight_key in known_info:
                        if known_info[insight_key].lower() in answer.lower():
                            comparison["confirmations"].append({
                                "category": category,
                                "question": question,
                                "confirmed_info": answer
                            })
                        else:
                            comparison["contradictions"].append({
                                "category": category,
                                "question": question,
                                "known": known_info[insight_key],
                                "detected": answer
                            })
                    else:
                        comparison["new_insights"].append({
                            "category": category,
                            "question": question,
                            "new_info": answer
                        })
        
        return comparison
    
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
        time_info = context_info.get("What time of day does this appear to be taken?", "")
        weather_info = context_info.get("What is the weather condition like?", "")
        season_info = context_info.get("What season does this appear to be?", "")
        
        if time_info and time_info != "분석 실패":
            clues["timestamp_clues"].append(f"촬영 시간대: {time_info}")
        if weather_info and weather_info != "분석 실패":
            clues["timestamp_clues"].append(f"날씨 상태: {weather_info}")
        if season_info and season_info != "분석 실패":
            clues["timestamp_clues"].append(f"계절: {season_info}")
        
        # 위치 관련 단서
        location_info = context_info.get("What kind of location is this? Indoor or outdoor?", "")
        building_info = context_info.get("What kind of building or area is in the background?", "")
        signs_info = context_info.get("Are there any signs or text visible?", "")
        
        if location_info and location_info != "분석 실패":
            clues["location_clues"].append(f"장소 유형: {location_info}")
        if building_info and building_info != "분석 실패":
            clues["location_clues"].append(f"배경 건물/지역: {building_info}")
        if signs_info and signs_info != "분석 실패":
            clues["location_clues"].append(f"주변 표지판/텍스트: {signs_info}")
        
        # 행동 관련 단서
        pace_info = detail_info.get("How is this person walking? Fast, slow, or normal pace?", "")
        posture_info = detail_info.get("What is their posture like? Straight, slouched, or hunched?", "")
        direction_info = detail_info.get("Which direction are they facing or moving?", "")
        alone_info = detail_info.get("Do they appear to be alone or with someone?", "")
        
        if pace_info and pace_info != "분석 실패":
            clues["behavioral_clues"].append(f"보행 속도: {pace_info}")
        if posture_info and posture_info != "분석 실패":
            clues["behavioral_clues"].append(f"자세: {posture_info}")
        if direction_info and direction_info != "분석 실패":
            clues["behavioral_clues"].append(f"이동 방향: {direction_info}")
        if alone_info and alone_info != "분석 실패":
            clues["behavioral_clues"].append(f"동행 여부: {alone_info}")
        
        # 신체적 특징 단서
        carrying_info = detail_info.get("Are they carrying anything in their hands?", "")
        jewelry_info = detail_info.get("Are they wearing any jewelry or watches?", "")
        footwear_info = detail_info.get("What kind of footwear are they wearing?", "")
        
        if carrying_info and carrying_info != "분석 실패":
            clues["physical_clues"].append(f"소지품: {carrying_info}")
        if jewelry_info and jewelry_info != "분석 실패":
            clues["physical_clues"].append(f"액세서리: {jewelry_info}")
        if footwear_info and footwear_info != "분석 실패":
            clues["physical_clues"].append(f"신발: {footwear_info}")
        
        # 환경적 단서
        people_info = context_info.get("Are there any other people visible in the image?", "")
        vehicle_info = context_info.get("Are there any vehicles visible?", "")
        lighting_info = context_info.get("What is the lighting condition?", "")
        
        if people_info and people_info != "분석 실패":
            clues["environmental_clues"].append(f"주변 인물: {people_info}")
        if vehicle_info and vehicle_info != "분석 실패":
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
            
            # 상세 분석 결과
            f.write(f"\n\n📋 상세 분석 결과\n")
            f.write("-" * 30 + "\n")
            
            f.write("\n🏙️ 상황 맥락 분석:\n")
            for question, answer in context_info.items():
                if answer != "분석 실패":
                    f.write(f"Q: {question}\n")
                    f.write(f"A: {answer}\n\n")
            
            f.write("\n👤 인물 세부 특징 분석:\n")
            for question, answer in detail_info.items():
                if answer != "분석 실패":
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
    parser = argparse.ArgumentParser(description="실종자 찾기 AI 데모 - 케이스 3")
    parser.add_argument("cctv_image", help="분석할 CCTV 이미지 경로")
    parser.add_argument("--face", "-f", help="얼굴 참조 이미지 (선택사항)")
    parser.add_argument("--known", "-k", help="기존 알려진 정보 JSON 파일 (선택사항)")
    parser.add_argument("--output", "-o", default="outputs", help="결과 저장 폴더")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.cctv_image):
        print(f"오류: CCTV 이미지를 찾을 수 없습니다: {args.cctv_image}")
        return
    
    print("=== 실종자 찾기 AI 데모 - 케이스 3 ===")
    print("CCTV + 얼굴 사진이 있지만 개인정보가 불명확한 경우")
    print("VQA로 보완 정보 추출하여 실종자 식별 단서 제공\n")
    
    # 기존 정보 로드 (있다면)
    known_info = {}
    if args.known and os.path.exists(args.known):
        try:
            with open(args.known, 'r', encoding='utf-8') as f:
                known_info = json.load(f)
            print(f"기존 정보 {len(known_info)}개 항목 로드됨")
        except Exception as e:
            print(f"기존 정보 로드 오류: {e}")
    
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
    
    # 3단계: 기존 정보와 비교 (있다면)
    extracted_info = {
        "context": context_info,
        "details": detail_info
    }
    
    if known_info:
        print("🔍 3단계: 기존 정보와 비교")
        comparison = processor.compare_with_known_info(extracted_info, known_info)
        print(f"새로운 정보: {len(comparison['new_insights'])}개")
        print(f"확인된 정보: {len(comparison['confirmations'])}개") 
        print(f"모순되는 정보: {len(comparison['contradictions'])}개")
    
    # 4단계: 식별 단서 생성
    print("💡 4단계: 식별 단서 생성")
    clues = processor.generate_identification_clues(context_info, detail_info, args.face)
    
    # 5단계: 수사 보고서 생성
    print("📋 5단계: 수사 보고서 생성")
    report_path = processor.create_investigation_report(context_info, detail_info, clues, args.output)
    
    print(f"\n✅ 케이스 3 처리 완료!")
    print(f"📄 수사 보고서: {report_path}")
    
    # 핵심 단서 요약 출력
    print("\n🔍 핵심 식별 단서 요약:")
    for category, clue_list in clues.items():
        if clue_list:
            category_name = {
                "timestamp_clues": "⏰ 시간 정보",
                "location_clues": "📍 위치 정보", 
                "behavioral_clues": "🚶 행동 패턴",
                "physical_clues": "👤 신체 특징",
                "environmental_clues": "🌍 환경 맥락"
            }.get(category, category)
            print(f"\n{category_name}:")
            for clue in clue_list[:3]:  # 상위 3개만 출력
                print(f"  • {clue}")

if __name__ == "__main__":
    main()