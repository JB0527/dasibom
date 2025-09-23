package site.dasibom.domain.report.dto;

import site.dasibom.domain.report.entity.Report;

public record ReportResponse(Long id, Long caseId, String description) {
    public static ReportResponse from(Report e) { 
        return new ReportResponse(e.getId(), e.getMissingCase().getId(), e.getDescription()); 
    }
}