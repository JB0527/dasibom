package site.dasibom.domain.report.dto;

import site.dasibom.domain.common.enums.ReportCertainty;
import site.dasibom.domain.report.entity.Report;

import java.time.LocalDateTime;

public record ReportResponse(
    Long id,
    Long caseId,
    LocalDateTime reportedAt,
    LocalDateTime sightedAt,
    String location,
    ReportCertainty certainty,
    String description,
    String attachmentUrl
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
            report.getId(),
            report.getMissingCase().getId(),
            report.getReportedAt(),
            report.getSightedAt(),
            report.getLocation(),
            report.getCertainty(),
            report.getDescription(),
            report.getAttachmentUrl()
        );
    }
}