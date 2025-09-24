package site.dasibom.domain.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public record CreateReportRequest(
    // 실종자 정보
    @NotNull Long caseId,
    
    // 신고자 정보
    @NotBlank String reporterName,
    @NotBlank String reporterPhone,
    String reporterEmail,
    
    // 목격 정보
    @NotBlank String sightingDate,
    @NotBlank String sightingTime,
    @NotBlank String sightingLocation,
    @NotNull Double latitude,
    @NotNull Double longitude,
    
    // 목격 상세 정보
    @NotBlank String certainty, // 'high', 'medium', 'low'
    @NotBlank String description,
    String additionalInfo,
    
    // 첨부 파일 - TODO: S3 업로드 구현 필요
    List<MultipartFile> photos,
    List<MultipartFile> videos
) {}