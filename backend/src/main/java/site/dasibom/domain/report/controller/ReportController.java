package site.dasibom.domain.report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import site.dasibom.global.common.ApiResponse;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.service.ReportService;
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
    
    @GetMapping("/{id}") 
    public ApiResponse<ReportResponse> get(@PathVariable Long id) { 
        return ApiResponse.ok(service.get(id)); 
    }
    
    @GetMapping 
    public ApiResponse<List<ReportResponse>> list() { 
        return ApiResponse.ok(service.list()); 
    }
}