package site.dasibom.domain.report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import site.dasibom.global.common.ApiResponse;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.dto.ReportDetailResponse;
import site.dasibom.domain.report.service.ReportService;

import java.time.LocalDateTime;
import java.util.List;

@RestController 
@RequestMapping("/api/reports") 
@RequiredArgsConstructor
public class ReportController {
    private final ReportService service;
    
    @PostMapping 
    public ApiResponse<ReportResponse> create(@RequestBody @Valid CreateReportRequest req) { 
        return ApiResponse.ok(service.create(req)); 
    }
    
    @GetMapping("/{reportId}") 
    public ApiResponse<ReportDetailResponse> getReport(@PathVariable Long reportId) { 
        ReportDetailResponse response = service.getDetail(reportId);
        return ApiResponse.ok(response); 
    }
    
    @GetMapping 
    public ApiResponse<List<ReportResponse>> list() { 
        return ApiResponse.ok(service.list()); 
    }
    
    // TODO: 실제 JWT 파싱 로직 구현 필요
    private String extractPhoneHashFromToken(String authorization) {
        // Bearer 토큰에서 실제 JWT 파싱하여 전화번호 해시 추출
        // 임시로 고정값 반환
        return "temp_phone_hash_" + System.currentTimeMillis();
    }
}