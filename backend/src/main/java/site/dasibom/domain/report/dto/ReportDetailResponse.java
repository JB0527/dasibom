package site.dasibom.domain.report.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import site.dasibom.domain.common.enums.ReportCertainty;
import site.dasibom.domain.report.entity.Report;

import java.time.LocalDateTime;

public record ReportDetailResponse(
    Long id,
    Long caseId,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    LocalDateTime reportedAt,
    String location,
    ReportCertainty certainty,
    String description,
    String attachmentUrl
) {
    public static ReportDetailResponse from(Report report) {
        return new ReportDetailResponse(
            report.getId(),
            report.getMissingCase().getId(),
            report.getReportedAt(),
            report.getLocation(),
            report.getCertainty(),
            report.getDescription(),
            report.getAttachmentUrl()
        );
    }
}