package site.dasibom.domain.report.entity;

import jakarta.persistence.*;
import lombok.*;
import site.dasibom.global.common.BaseEntity;
import site.dasibom.domain.common.enums.ReportCertainty;
import site.dasibom.domain.common.enums.ProviderType;
import site.dasibom.domain.missingcase.entity.MissingCase;

import java.time.LocalDateTime;

@Getter 
@Setter 
@NoArgsConstructor
@Entity 
@Table(name="report")
public class Report extends BaseEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private MissingCase missingCase;

    @Column(nullable = false)
    private LocalDateTime reportedAt = LocalDateTime.now(); // 제보시각
    
    @Column(nullable = false)
    private LocalDateTime sightedAt; // 목격시각
    
    @Column(length = 500)
    private String location; // 목격위치 (JSON 문자열 등)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportCertainty certainty = ReportCertainty.MEDIUM; // 확신도
    
    @Column(columnDefinition = "TEXT")
    private String description; // 제보내용
    
    @Column(columnDefinition = "TEXT")
    private String additionalInfo; // 추가 정보
    
    @Column(length = 500)
    private String attachmentUrl; // 첨부파일URL

    // 신고자 정보
    @Column(nullable = false, length = 100)
    private String reporterName; // 신고자 이름
    
    @Column(length = 100)
    private String reporterEmail; // 신고자 이메일

    // 본인인증 메타
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProviderType verifiedProvider = ProviderType.PASS; // 인증수단
    
    @Column(nullable = false, length = 64)
    private String verifiedPhoneHash; // 전화번호해시
    
    @Column(nullable = false)
    private LocalDateTime verifiedAt = LocalDateTime.now(); // 인증시각
    
    @Column(length = 64)
    private String verificationRef; // 외부참조ID
}