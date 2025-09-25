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
import site.dasibom.domain.common.enums.ReportCertainty;
import site.dasibom.domain.common.enums.ProviderType;
import site.dasibom.global.service.S3Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.ArrayList;

@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class ReportService {
    private final ReportRepository repo;
    private final MissingCaseRepository missingCaseRepository;
    private final S3Service s3Service;
    
    @Transactional 
<<<<<<< HEAD
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
=======
    public ReportResponse create(CreateReportRequest req) { 
        Report r = new Report(); 
        
        // 실종 사건 조회
        MissingCase missingCase = missingCaseRepository.findById(req.caseId())
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        r.setMissingCase(missingCase);
        
        // 신고자 정보
        r.setReporterName(req.reporterName());
        r.setReporterEmail(req.reporterEmail());
        r.setVerifiedPhoneHash(hashPhone(req.reporterPhone()));
        r.setVerifiedProvider(ProviderType.PASS); // TODO: 실제 인증 방식에 따라 동적 설정
        
        // 목격 정보
        r.setSightedAt(parseDateTime(req.sightingDate(), req.sightingTime()));
        r.setSightingAddress(req.sightingLocation());
        r.setLocationLat(req.latitude());
        r.setLocationLon(req.longitude());
        
        // 목격 상세 정보
        r.setCertainty(parseCertainty(req.certainty()));
        r.setDescription(req.description());
        r.setAdditionalInfo(req.additionalInfo());
        
        // 파일 처리 - S3 업로드
        List<String> allUrls = new ArrayList<>();
        
        if (req.photos() != null && !req.photos().isEmpty()) {
            String photoUrls = s3Service.uploadFiles(req.photos(), "reports/photos");
            if (photoUrls != null) {
                allUrls.add(photoUrls);
            }
        }
        
        if (req.videos() != null && !req.videos().isEmpty()) {
            String videoUrls = s3Service.uploadFiles(req.videos(), "reports/videos");
            if (videoUrls != null) {
                allUrls.add(videoUrls);
            }
        }
        
        if (!allUrls.isEmpty()) {
            r.setAttachmentUrl(String.join(",", allUrls));
        }
        
        return ReportResponse.from(repo.save(r)); 
>>>>>>> f21cd6c687a2912a95e314905c631668cb5f3a3a
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
    
    private LocalDateTime parseDateTime(String date, String time) {
        try {
            String dateTimeStr = date + " " + time;
            return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date/time format: " + date + " " + time, e);
        }
    }
    
    private ReportCertainty parseCertainty(String certainty) {
        return switch (certainty.toLowerCase()) {
            case "low" -> ReportCertainty.LOW;
            case "medium" -> ReportCertainty.MEDIUM;
            case "high" -> ReportCertainty.HIGH;
            default -> throw new IllegalArgumentException("Invalid certainty value: " + certainty);
        };
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