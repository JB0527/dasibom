"""
AWS Bedrock 설정 및 인증 관리
"""

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional

class AWSConfig:
    """AWS Bedrock 설정 클래스"""
    
    def __init__(self, region_name: str = 'us-east-1'):
        self.region_name = region_name
        self.bedrock_runtime = None
        
    def setup_credentials(self, access_key_id: Optional[str] = None, 
                         secret_access_key: Optional[str] = None,
                         session_token: Optional[str] = None):
        """AWS 인증 정보 설정"""
        
        if access_key_id and secret_access_key:
            # 직접 제공된 자격 증명 사용
            os.environ['AWS_ACCESS_KEY_ID'] = access_key_id
            os.environ['AWS_SECRET_ACCESS_KEY'] = secret_access_key
            if session_token:
                os.environ['AWS_SESSION_TOKEN'] = session_token
        
        # 다른 방법들:
        # 1. AWS CLI 설정 사용: aws configure
        # 2. IAM 역할 사용 (EC2에서 실행 시)
        # 3. 환경 변수 사용
        
    def validate_credentials(self) -> bool:
        """AWS 자격 증명 유효성 검사"""
        try:
            sts = boto3.client('sts', region_name=self.region_name)
            response = sts.get_caller_identity()
            print(f"✅ AWS 인증 성공: {response.get('Arn', 'Unknown')}")
            return True
        except (NoCredentialsError, ClientError) as e:
            print(f"❌ AWS 인증 실패: {e}")
            return False
    
    def setup_bedrock_client(self) -> bool:
        """Bedrock Runtime 클라이언트 초기화"""
        try:
            self.bedrock_runtime = boto3.client(
                service_name='bedrock-runtime',
                region_name=self.region_name
            )
            
            # 모델 접근 권한 확인
            bedrock = boto3.client('bedrock', region_name=self.region_name)
            response = bedrock.list_foundation_models()
            
            available_models = [model['modelId'] for model in response['modelSummaries']]
            
            # 필요한 모델들 확인
            required_models = [
                'anthropic.claude-3-sonnet-20240229-v1:0',
                'stability.stable-diffusion-xl-v1'
            ]
            
            for model_id in required_models:
                if any(model_id in available for available in available_models):
                    print(f"✅ 모델 접근 가능: {model_id}")
                else:
                    print(f"⚠️  모델 접근 불가: {model_id}")
                    print(f"   모델 접근 권한을 요청하세요: https://console.aws.amazon.com/bedrock/")
            
            print(f"✅ Bedrock 클라이언트 초기화 완료 (리전: {self.region_name})")
            return True
            
        except ClientError as e:
            print(f"❌ Bedrock 클라이언트 초기화 실패: {e}")
            return False
    
    def get_bedrock_client(self):
        """Bedrock Runtime 클라이언트 반환"""
        if not self.bedrock_runtime:
            if not self.setup_bedrock_client():
                raise Exception("Bedrock 클라이언트 초기화에 실패했습니다.")
        return self.bedrock_runtime

def setup_aws_environment():
    """AWS 환경 설정 헬퍼 함수"""
    print("=== AWS Bedrock 환경 설정 ===\n")
    
    # 1. 리전 설정
    region = input("AWS 리전을 입력하세요 (기본: us-east-1): ").strip()
    if not region:
        region = 'us-east-1'
    
    config = AWSConfig(region_name=region)
    
    # 2. 자격 증명 방법 선택
    print("\nAWS 자격 증명 방법을 선택하세요:")
    print("1. AWS CLI 설정 사용 (추천)")
    print("2. 환경 변수 사용")
    print("3. 직접 입력")
    print("4. IAM 역할 사용 (EC2에서 실행 시)")
    
    choice = input("선택 (1-4): ").strip()
    
    if choice == "3":
        access_key = input("AWS Access Key ID: ").strip()
        secret_key = input("AWS Secret Access Key: ").strip()
        session_token = input("AWS Session Token (선택사항): ").strip()
        
        config.setup_credentials(access_key, secret_key, session_token if session_token else None)
    
    # 3. 자격 증명 검증
    print("\n자격 증명 검증 중...")
    if not config.validate_credentials():
        print("❌ AWS 자격 증명 설정을 확인하세요.")
        return None
    
    # 4. Bedrock 클라이언트 설정
    print("\nBedrock 클라이언트 설정 중...")
    if not config.setup_bedrock_client():
        print("❌ Bedrock 설정을 확인하세요.")
        return None
    
    print("\n✅ AWS Bedrock 환경 설정 완료!")
    return config

if __name__ == "__main__":
    # 대화형 설정
    config = setup_aws_environment()
    
    if config:
        print(f"\n🎉 설정이 완료되었습니다!")
        print(f"리전: {config.region_name}")
        print("\n이제 Bedrock 기반 스크립트를 실행할 수 있습니다:")
        print("python bedrock_case1.py [이미지_경로]")
        print("python bedrock_case2.py -i [정보_파일] -f [얼굴_사진]")
        print("python bedrock_case3.py [CCTV_이미지] -f [얼굴_사진]")