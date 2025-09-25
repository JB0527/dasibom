package site.dasibom.domain.report.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import site.dasibom.domain.report.entity.Report;
import java.time.Instant;
import java.time.LocalDateTime;

public record ReportResponse(
    Long id,
    Long caseId,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    LocalDateTime reportedAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
            report.getId(),
            report.getMissingCase().getId(),
            report.getReportedAt()
        );
    }
}