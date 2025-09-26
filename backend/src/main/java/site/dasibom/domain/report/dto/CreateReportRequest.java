package site.dasibom.domain.report.dto;

import jakarta.validation.constraints.NotNull;
import site.dasibom.domain.common.enums.ReportCertainty;

import java.time.LocalDateTime;

public record CreateReportRequest(
    @NotNull Long caseId,
    LocalDateTime sightedAt,
    @NotNull String location,
    @NotNull ReportCertainty certainty,
    String description,
    String attachmentUrl
) {}