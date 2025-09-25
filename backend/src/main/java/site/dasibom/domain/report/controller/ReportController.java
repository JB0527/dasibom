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
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReportResponse> createReport(
            @RequestHeader("Authorization") String authorization,
            @RequestBody @Valid CreateReportRequest request) {
        
        // TODO: JWT 토큰에서 전화번호 해시 추출 (임시로 하드코딩)
        String verifiedPhoneHash = extractPhoneHashFromToken(authorization);
        
        // reportedAt이 null인 경우 현재 시각으로 설정
        CreateReportRequest processedRequest = request;
        if (request.reportedAt() == null) {
            processedRequest = new CreateReportRequest(
                request.caseId(),
                LocalDateTime.now(),
                request.location(),
                request.certainty(),
                request.description(),
                request.attachmentUrl()
            );
        }
        
        ReportResponse response = service.create(processedRequest, verifiedPhoneHash);
        return ApiResponse.ok(response);
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