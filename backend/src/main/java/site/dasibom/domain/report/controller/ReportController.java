package site.dasibom.domain.report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody CreateReportRequest request) {
        log.info("신고 접수 요청 - CaseId: {}, Location: {}", request.caseId(), request.location());
        
        try {
            ReportResponse response = reportService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("신고 접수 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("신고 접수 중 서버 오류", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        try {
            List<ReportResponse> reports = reportService.findAll();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("신고 목록 조회 중 서버 오류", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable Long id) {
        try {
            ReportResponse response = reportService.findById(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("신고 조회 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("신고 조회 중 서버 오류", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}