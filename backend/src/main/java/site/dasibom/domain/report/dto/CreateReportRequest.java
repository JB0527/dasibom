package site.dasibom.domain.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateReportRequest(@NotNull Long caseId, @NotBlank String description) {}