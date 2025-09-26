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
            @RequestParam("missingPersonId") Long missingPersonId,
            @RequestParam(value = "sightingDate", required = false) String sightingDate,
            @RequestParam(value = "sightingTime", required = false) String sightingTime,
            @RequestParam("sightingLocation") String sightingLocation,
            @RequestParam("certainty") String certaintyStr,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "photos[0]", required = false) MultipartFile photo) {

        log.info("신고 접수 요청 (multipart) - MissingPersonId: {}, Location: {}", missingPersonId, sightingLocation);

        // Parse sighting date and time
        LocalDateTime sightedAt = null;
        if (sightingDate != null && !sightingDate.isEmpty()) {
            try {
                if (sightingTime != null && !sightingTime.isEmpty()) {
                    // Combine date and time: "2024-01-15" + "14:30" -> "2024-01-15T14:30:00"
                    String dateTimeStr = sightingDate + "T" + sightingTime + ":00";
                    sightedAt = LocalDateTime.parse(dateTimeStr);
                } else {
                    // Only date provided, set time to current time
                    sightedAt = LocalDateTime.parse(sightingDate + "T00:00:00");
                }
            } catch (Exception e) {
                log.warn("Invalid sighting date/time format: {} {}", sightingDate, sightingTime);
                sightedAt = LocalDateTime.now();
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
        if (photo != null && !photo.isEmpty()) {
            attachmentUrl = reportService.uploadAttachment(photo);
        }

        // Create request DTO
        CreateReportRequest request = new CreateReportRequest(
            missingPersonId,
            sightedAt,
            sightingLocation,
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