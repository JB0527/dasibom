package site.dasibom.domain.report.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import site.dasibom.domain.common.enums.ReportCertainty;

import java.time.LocalDateTime;

public record CreateReportRequest(
    @NotNull Long caseId,
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    LocalDateTime reportedAt,
    
    @NotNull String location,
    
    @NotNull ReportCertainty certainty,
    
    String description,
    
    String attachmentUrl
) {}