package site.dasibom.domain.report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import site.dasibom.global.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.service.ReportService;

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