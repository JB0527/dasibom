"""
S3 유틸리티 함수들 - 이미지 다운로드 및 결과 업로드
"""

import boto3
import requests
import os
import base64
from io import BytesIO
from PIL import Image
from typing import List, Optional, Tuple
from datetime import datetime

class S3Manager:
    def __init__(self, bucket_name: str = "seoul-ht-06-dasibom", region_name: str = 'us-east-1'):
        """S3 매니저 초기화 (EC2 IAM 역할 자동 감지)"""
        self.bucket_name = bucket_name
        self.region_name = region_name
        
        # IAM 역할 또는 기타 자격 증명 자동 감지
        try:
            self.s3_client = boto3.client('s3', region_name=region_name)
            
            # 인증 확인
            sts = boto3.client('sts', region_name=region_name)
            identity = sts.get_caller_identity()
            arn = identity.get('Arn', '')
            
            if ':assumed-role/' in arn:
                print(f"✅ S3 클라이언트 EC2 IAM 역할로 초기화: {arn.split('/')[-2]}")
            else:
                print(f"✅ S3 클라이언트 초기화 완료: {region_name}")
                
        except Exception as e:
            print(f"❌ S3 클라이언트 초기화 실패: {e}")
            print("💡 EC2 인스턴스에 적절한 IAM 역할이 연결되어 있는지 확인하세요.")
            raise
        
    def download_image_from_source(self, image_source: str) -> bytes:
        """
        다양한 소스에서 이미지 다운로드
        - S3 URL: s3://bucket/key
        - HTTP URL: http://... 또는 https://...
        - 로컬 파일: 파일 경로
        """
        try:
            if image_source.startswith('s3://'):
                return self._download_from_s3(image_source)
            elif image_source.startswith('http'):
                return self._download_from_url(image_source)
            else:
                return self._read_local_file(image_source)
        except Exception as e:
            print(f"이미지 다운로드 실패: {e}")
            raise
    
    def _download_from_s3(self, s3_url: str) -> bytes:
        """S3에서 이미지 다운로드"""
        # s3://bucket/key 형태에서 bucket과 key 추출
        s3_path = s3_url.replace('s3://', '')
        bucket, key = s3_path.split('/', 1)
        
        response = self.s3_client.get_object(Bucket=bucket, Key=key)
        return response['Body'].read()
    
    def _download_from_url(self, url: str) -> bytes:
        """HTTP URL에서 이미지 다운로드"""
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    
    def _read_local_file(self, file_path: str) -> bytes:
        """로컬 파일 읽기"""
        with open(file_path, 'rb') as f:
            return f.read()
    
    def encode_image_from_source(self, image_source: str) -> str:
        """이미지 소스를 base64로 인코딩"""
        image_bytes = self.download_image_from_source(image_source)
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def upload_image_to_s3(self, image_data: bytes, case_id: str, file_name: str, 
                          case_type: str = "general") -> str:
        """
        이미지를 S3에 업로드
        폴더 구조: cases/{case_type}/{case_id}/images/{timestamp}_{file_name}
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        s3_key = f"cases/{case_type}/{case_id}/images/{timestamp}_{file_name}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=image_data,
                ContentType='image/png'
            )
            
            s3_url = f"s3://{self.bucket_name}/{s3_key}"
            print(f"이미지 업로드 완료: {s3_url}")
            return s3_url
            
        except Exception as e:
            print(f"S3 업로드 실패: {e}")
            raise
    
    def upload_pil_image_to_s3(self, pil_image: Image.Image, case_id: str, 
                              file_name: str, case_type: str = "general") -> str:
        """PIL Image를 S3에 업로드"""
        # PIL Image를 bytes로 변환
        img_buffer = BytesIO()
        pil_image.save(img_buffer, format='PNG')
        image_data = img_buffer.getvalue()
        
        return self.upload_image_to_s3(image_data, case_id, file_name, case_type)
    
    def upload_text_to_s3(self, text_content: str, case_id: str, file_name: str, 
                         case_type: str = "general") -> str:
        """
        텍스트 파일을 S3에 업로드
        폴더 구조: cases/{case_type}/{case_id}/reports/{timestamp}_{file_name}
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        s3_key = f"cases/{case_type}/{case_id}/reports/{timestamp}_{file_name}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=text_content.encode('utf-8'),
                ContentType='text/plain; charset=utf-8'
            )
            
            s3_url = f"s3://{self.bucket_name}/{s3_key}"
            print(f"보고서 업로드 완료: {s3_url}")
            return s3_url
            
        except Exception as e:
            print(f"S3 업로드 실패: {e}")
            raise
    
    def upload_json_to_s3(self, json_content: str, case_id: str, file_name: str, 
                         case_type: str = "general") -> str:
        """
        JSON 파일을 S3에 업로드
        폴더 구조: cases/{case_type}/{case_id}/data/{timestamp}_{file_name}
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        s3_key = f"cases/{case_type}/{case_id}/data/{timestamp}_{file_name}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=json_content.encode('utf-8'),
                ContentType='application/json'
            )
            
            s3_url = f"s3://{self.bucket_name}/{s3_key}"
            print(f"데이터 업로드 완료: {s3_url}")
            return s3_url
            
        except Exception as e:
            print(f"S3 업로드 실패: {e}")
            raise

    def list_images_in_prefix(self, prefix: str) -> List[str]:
        """지정된 S3 prefix에서 이미지 파일 전체 목록을 반환"""
        if prefix.startswith('s3://'):
            s3_path = prefix.replace('s3://', '', 1)
            if '/' in s3_path:
                bucket, key_prefix = s3_path.split('/', 1)
            else:
                bucket, key_prefix = s3_path, ''
        else:
            bucket, key_prefix = self.bucket_name, prefix

        if bucket != self.bucket_name:
            print(f"⚠️ 다른 버킷 접근: {bucket} → IAM 권한을 확인하세요")

        if key_prefix and not key_prefix.endswith('/'):
            key_prefix = f"{key_prefix}/"

        paginator = self.s3_client.get_paginator('list_objects_v2')
        image_urls: List[str] = []

        try:
            for page in paginator.paginate(Bucket=bucket, Prefix=key_prefix):
                contents = page.get('Contents', [])
                for obj in contents:
                    key = obj['Key']
                    if key.endswith('/'):
                        continue
                    lower_key = key.lower()
                    if lower_key.endswith(('.jpg', '.jpeg', '.png', '.bmp', '.webp')):
                        image_urls.append(f"s3://{bucket}/{key}")
            print(f"✅ Prefix '{prefix}'에서 {len(image_urls)}개 이미지 발견")
            return image_urls
        except Exception as e:
            print(f"❌ Prefix 이미지 조회 실패: {e}")
            return []
    
    def get_case_results(self, case_id: str, case_type: str = "general") -> dict:
        """케이스의 모든 결과 파일 목록 조회"""
        prefix = f"cases/{case_type}/{case_id}/"
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            results = {
                'images': [],
                'reports': [],
                'data': []
            }
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    s3_url = f"s3://{self.bucket_name}/{key}"
                    
                    if '/images/' in key:
                        results['images'].append(s3_url)
                    elif '/reports/' in key:
                        results['reports'].append(s3_url)
                    elif '/data/' in key:
                        results['data'].append(s3_url)
            
            return results
            
        except Exception as e:
            print(f"케이스 결과 조회 실패: {e}")
            return {'images': [], 'reports': [], 'data': []}

def generate_case_id() -> str:
    """케이스 ID 생성 (timestamp 기반)"""
    return datetime.now().strftime("%Y%m%d_%H%M%S")
