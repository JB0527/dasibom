package site.dasibom.domain.report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import site.dasibom.global.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.service.ReportService;
import site.dasibom.domain.common.enums.ReportCertainty;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    
    private final ReportService reportService;
    
    @PostMapping
    public ApiResponse<ReportResponse> createReport(@Valid @RequestBody CreateReportRequest request) {
        log.info("신고 접수 요청 - CaseId: {}, Location: {}", request.caseId(), request.location());

        ReportResponse response = reportService.create(request);
        return ApiResponse.ok(response);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ApiResponse<ReportResponse> createReportWithFile(
            @RequestParam("caseId") Long caseId,
            @RequestParam(value = "sightedAt", required = false) String sightedAtStr,
            @RequestParam("location") String location,
            @RequestParam("certainty") String certaintyStr,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "attachment", required = false) MultipartFile attachment) {

        log.info("신고 접수 요청 (multipart) - CaseId: {}, Location: {}", caseId, location);

        // Parse sightedAt if provided
        LocalDateTime sightedAt = null;
        if (sightedAtStr != null && !sightedAtStr.isEmpty()) {
            try {
                sightedAt = LocalDateTime.parse(sightedAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                log.warn("Invalid sightedAt format: {}", sightedAtStr);
            }
        }

        // Parse certainty
        ReportCertainty certainty;
        try {
            certainty = ReportCertainty.valueOf(certaintyStr.toUpperCase());
        } catch (Exception e) {
            log.warn("Invalid certainty value: {}, using default LIKELY", certaintyStr);
            certainty = ReportCertainty.LIKELY;
        }

        // Handle file upload if present
        String attachmentUrl = null;
        if (attachment != null && !attachment.isEmpty()) {
            attachmentUrl = reportService.uploadAttachment(attachment);
        }

        // Create request DTO
        CreateReportRequest request = new CreateReportRequest(
            caseId,
            sightedAt,
            location,
            certainty,
            description,
            attachmentUrl
        );

        ReportResponse response = reportService.create(request);
        return ApiResponse.ok(response);
    }
    
    @GetMapping
    public ApiResponse<List<ReportResponse>> getAllReports() {
        List<ReportResponse> reports = reportService.findAll();
        return ApiResponse.ok(reports);
    }
    
    @GetMapping("/{id}")
    public ApiResponse<ReportResponse> getReportById(@PathVariable Long id) {
        ReportResponse response = reportService.findById(id);
        return ApiResponse.ok(response);
    }
}