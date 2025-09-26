package site.dasibom.global.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {
    
    // TODO: AWS S3 SDK dependency 추가 필요
    // implementation 'software.amazon.awssdk:s3:2.20.26'
    
    // TODO: S3 설정 추가 필요 (application.yml)
    // aws:
    //   s3:
    //     bucket-name: your-bucket-name
    //     region: ap-northeast-2
    //     access-key: your-access-key
    //     secret-key: your-secret-key
    
    // TODO: S3Client Bean 설정 필요
    // private final S3Client s3Client;
    
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
            // TODO: 파일 검증 로직 추가
            validateFile(file);
            
            // TODO: 고유한 파일명 생성
            String fileName = generateFileName(file.getOriginalFilename());
            String key = folder + "/" + fileName;
            
            // TODO: S3 업로드 구현
            // PutObjectRequest putObjectRequest = PutObjectRequest.builder()
            //     .bucket(bucketName)
            //     .key(key)
            //     .contentType(file.getContentType())
            //     .build();
            // 
            // s3Client.putObject(putObjectRequest, 
            //     RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            
            // TODO: S3 URL 반환
            // return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
            
            // 임시 더미 URL 반환
            log.warn("S3Service not implemented. Returning dummy URL for file: {}", file.getOriginalFilename());
            return "https://dummy-bucket.s3.amazonaws.com/" + key;
            
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("S3 파일 업로드 실패", e);
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
        // TODO: S3 파일 삭제 구현
        // String key = extractKeyFromUrl(fileUrl);
        // DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
        //     .bucket(bucketName)
        //     .key(key)
        //     .build();
        // s3Client.deleteObject(deleteObjectRequest);
        
        log.warn("S3Service deleteFile not implemented for URL: {}", fileUrl);
    }
}