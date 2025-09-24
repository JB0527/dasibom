package site.dasibom.domain.report.dto;

import site.dasibom.domain.report.entity.Report;
import java.time.Instant;

public record ReportResponse(
    Long id,
    Long caseId,
    
    // 신고자 정보
    String reporterName,
    String reporterPhone, // 해시된 전화번호 반환은 보안상 문제가 있을 수 있음 - TODO: 고려 필요
    String reporterEmail,
    
    // 목격 정보
    String sightingDate, // sightedAt에서 변환
    String sightingTime, // sightedAt에서 변환
    String sightingLocation,
    Double latitude,
    Double longitude,
    
    // 목격 상세 정보
    String certainty, // enum을 String으로 변환
    String description,
    String additionalInfo,
    
    // 메타 정보
    String attachmentUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ReportResponse from(Report e) { 
        return new ReportResponse(
            e.getId(), 
            e.getMissingCase().getId(),
            e.getReporterName(),
            null, // 보안상 전화번호 해시는 반환하지 않음
            e.getReporterEmail(),
            e.getSightedAt().toLocalDate().toString(),
            e.getSightedAt().toLocalTime().toString(),
            e.getSightingAddress(),
            e.getLocationLat(),
            e.getLocationLon(),
            e.getCertainty().toString().toLowerCase(),
            e.getDescription(),
            e.getAdditionalInfo(),
            e.getAttachmentUrl(),
            e.getCreatedAt(),
            e.getUpdatedAt()
        ); 
    }
}