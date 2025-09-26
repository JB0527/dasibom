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
import site.dasibom.domain.common.enums.ProviderType;
import site.dasibom.global.service.S3Service;
import java.time.LocalDateTime;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class ReportService {
    private final ReportRepository repo;
    private final MissingCaseRepository missingCaseRepository;
    private final S3Service s3Service;
    
    @Transactional 
    public ReportResponse create(CreateReportRequest req, String verifiedPhoneHash) { 
        return persistReport(req, verifiedPhoneHash);
    }

    @Transactional
    public ReportResponse create(CreateReportRequest req) {
        return persistReport(req, null);
    }

    private ReportResponse persistReport(CreateReportRequest req, String verifiedPhoneHash) {
        MissingCase missingCase = missingCaseRepository.findById(req.caseId())
            .orElseThrow(() -> new IllegalArgumentException("실종사건을 찾을 수 없습니다: " + req.caseId()));

        Report report = new Report();
        report.setMissingCase(missingCase);

        LocalDateTime reportedAt = req.reportedAt() != null ? req.reportedAt() : LocalDateTime.now();
        report.setReportedAt(reportedAt);
        report.setSightedAt(reportedAt);

        report.setLocation(req.location());
        report.setCertainty(req.certainty());
        report.setDescription(req.description());
        report.setAttachmentUrl(req.attachmentUrl());

        report.setReporterName("익명 신고자");
        report.setVerifiedProvider(ProviderType.PASS);
        report.setVerifiedPhoneHash(resolvePhoneHash(verifiedPhoneHash));

        return ReportResponse.from(repo.save(report));
    }

    private String resolvePhoneHash(String verifiedPhoneHash) {
        if (verifiedPhoneHash != null && !verifiedPhoneHash.isBlank()) {
            return verifiedPhoneHash;
        }
        return hashPhone("UNVERIFIED");
    }
    
    private String hashPhone(String phone) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(phone.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash phone number", e);
        }
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
