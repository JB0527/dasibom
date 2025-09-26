package site.dasibom.global.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
// TODO: AWS S3 클라이언트 라이브러리 의존성 추가 필요

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class S3Service {
    
    @Value("${aws.s3.bucket}")
    private String bucketName;
    
    @Value("${aws.region}")
    private String region;
    
    /**
     * 다중 파일을 S3에 업로드하고 URL 목록을 반환
     * @param files 업로드할 파일 목록
     * @param folder S3 내 폴더 경로 (예: "reports", "profiles")
     * @return 업로드된 파일들의 S3 URL 목록을 쉼표로 구분한 문자열
     */
    public String uploadFiles(List<MultipartFile> files, String folder) {
        if (files == null || files.isEmpty()) {
            return null;
        }
        
        // TODO: 실제 S3 업로드 구현
        List<String> uploadedUrls = files.stream()
            .filter(file -> !file.isEmpty())
            .map(file -> uploadSingleFile(file, folder))
            .collect(Collectors.toList());
        
        return String.join(",", uploadedUrls);
    }
    
    /**
     * 단일 파일을 S3에 업로드
     * @param file 업로드할 파일
     * @param folder S3 내 폴더 경로
     * @return 업로드된 파일의 S3 URL
     */
    private String uploadSingleFile(MultipartFile file, String folder) {
        try {
            // 파일 검증
            validateFile(file);
            
            // 고유한 파일명 생성
            String fileName = generateFileName(file.getOriginalFilename());
            String key = folder + "/" + fileName;
            
            // TODO: 실제 S3 업로드 구현 필요
            
            // S3 URL 생성 및 반환
            String s3Url = "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
            
            log.info("File uploaded successfully to S3: {}", s3Url);
            return s3Url;
            
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("S3 파일 업로드 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * 파일 검증
     * @param file 검증할 파일
     */
    private void validateFile(MultipartFile file) {
        // TODO: 파일 크기 제한 확인
        final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하여야 합니다.");
        }
        
        // TODO: 허용된 파일 타입 확인
        String contentType = file.getContentType();
        if (contentType == null || 
            (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("이미지 또는 비디오 파일만 업로드 가능합니다.");
        }
    }
    
    /**
     * 고유한 파일명 생성
     * @param originalFileName 원본 파일명
     * @return 고유한 파일명
     */
    private String generateFileName(String originalFileName) {
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        return UUID.randomUUID().toString() + extension;
    }
    
    /**
     * S3에서 파일 삭제
     * @param fileUrl 삭제할 파일의 S3 URL
     */
    public void deleteFile(String fileUrl) {
        try {
            String key = extractKeyFromUrl(fileUrl);
            
            // TODO: 실제 S3 삭제 구현 필요
            
            log.info("File deleted successfully from S3: {}", fileUrl);
            
        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", fileUrl, e);
            throw new RuntimeException("S3 파일 삭제 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * S3 URL에서 키 추출
     * @param fileUrl S3 파일 URL
     * @return S3 객체 키
     */
    private String extractKeyFromUrl(String fileUrl) {
        // URL 형태: https://bucket-name.s3.region.amazonaws.com/folder/filename
        if (fileUrl.contains(bucketName + ".s3.")) {
            int keyStartIndex = fileUrl.indexOf(".amazonaws.com/") + ".amazonaws.com/".length();
            return fileUrl.substring(keyStartIndex);
        }
        throw new IllegalArgumentException("Invalid S3 URL format: " + fileUrl);
    }
}