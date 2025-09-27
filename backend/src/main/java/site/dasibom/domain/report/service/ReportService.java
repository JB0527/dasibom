package site.dasibom.domain.report.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.entity.Report;
import site.dasibom.domain.report.repository.ReportRepository;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.global.service.S3Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {
    
    private final ReportRepository reportRepository;
    private final MissingCaseRepository missingCaseRepository;
    private final S3Service s3Service;
    
    @Transactional
    public ReportResponse create(CreateReportRequest request) {
        MissingCase missingCase;

        // Report 엔티티 생성
        Report report = new Report();

        // 더미 데이터 케이스 확인 (1000-1003)
        if (request.caseId() >= 1000L && request.caseId() <= 1003L) {
            // 더미 케이스는 native query로 직접 삽입
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime sightedAt = request.sightedAt() != null ? request.sightedAt() : now;

            reportRepository.insertReportForDummyCase(
                request.caseId(),
                now,
                sightedAt,
                request.location(),
                request.certainty().name(),
                request.description(),
                request.attachmentUrl(),
                now,
                now
            );

            // 더미 응답 생성 (ID는 알 수 없으므로 0으로 설정)
            return new ReportResponse(
                0L,
                request.caseId(),
                now,
                sightedAt,
                request.location(),
                request.certainty(),
                request.description(),
                request.attachmentUrl()
            );
        } else {
            // 실종사건 존재 확인
            missingCase = missingCaseRepository.findById(request.caseId())
                .orElseThrow(() -> new IllegalArgumentException("실종사건을 찾을 수 없습니다: " + request.caseId()));
            report.setMissingCase(missingCase);
        }

        report.setReportedAt(LocalDateTime.now());
        report.setSightedAt(request.sightedAt() != null ? request.sightedAt() : LocalDateTime.now());
        report.setLocation(request.location());
        report.setCertainty(request.certainty());
        report.setDescription(request.description());
        report.setAttachmentUrl(request.attachmentUrl());

        // 저장
        Report savedReport = reportRepository.save(report);
        
        log.info("신고 접수 완료 - ID: {}, Case: {}, Location: {}", 
                savedReport.getId(), request.caseId(), request.location());
        
        return ReportResponse.from(savedReport);
    }
    
    public List<ReportResponse> findAll() {
        return reportRepository.findAll().stream()
            .map(ReportResponse::from)
            .toList();
    }
    
    public ReportResponse findById(Long id) {
        Report report = reportRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("제보를 찾을 수 없습니다: " + id));
        return ReportResponse.from(report);
    }

    /**
     * 첨부파일 업로드
     */
    public String uploadAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            return s3Service.uploadFiles(Arrays.asList(file), "reports");
        } catch (Exception e) {
            log.error("첨부파일 업로드 실패: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("첨부파일 업로드에 실패했습니다: " + e.getMessage(), e);
        }
    }
}