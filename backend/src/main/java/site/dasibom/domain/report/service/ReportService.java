package site.dasibom.domain.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.dto.ReportDetailResponse;
import site.dasibom.domain.report.entity.Report;
import site.dasibom.domain.report.repository.ReportRepository;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.missingcase.entity.MissingCase;
import java.util.List;

@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class ReportService {
    private final ReportRepository repo;
    private final MissingCaseRepository missingCaseRepository;
    
    @Transactional 
    public ReportResponse create(CreateReportRequest req, String verifiedPhoneHash) { 
        // 실종사건 존재 확인
        MissingCase missingCase = missingCaseRepository.findById(req.caseId())
            .orElseThrow(() -> new IllegalArgumentException("실종사건을 찾을 수 없습니다: " + req.caseId()));
        
        Report report = new Report(); 
        report.setMissingCase(missingCase);
        
        // 제보 시각 (기본값: 현재 시각)
        if (req.reportedAt() != null) {
            report.setReportedAt(req.reportedAt());
        }
        
        // 목격 시각은 제보 시각과 동일하게 설정 (단순화)
        report.setSightedAt(report.getReportedAt());
        
        // 위치 정보는 이미 String으로 받음
        report.setLocation(req.location());
        
        // 확신도
        report.setCertainty(req.certainty());
        
        // 설명 및 첨부파일
        report.setDescription(req.description());
        report.setAttachmentUrl(req.attachmentUrl());
        
        // 인증 정보 (JWT에서 추출된 전화번호 해시)
        report.setVerifiedPhoneHash(verifiedPhoneHash);
        
        return ReportResponse.from(repo.save(report)); 
    }
    
    public ReportResponse get(Long id) { 
        return ReportResponse.from(repo.findById(id).orElseThrow()); 
    }
    
    public ReportDetailResponse getDetail(Long id) {
        Report report = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("제보를 찾을 수 없습니다: " + id));
        return ReportDetailResponse.from(report);
    }
    
    public List<ReportResponse> list() { 
        return repo.findAll().stream().map(ReportResponse::from).toList(); 
    }
}