package site.dasibom.domain.report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import site.dasibom.global.common.BaseEntity;
import site.dasibom.domain.common.enums.ReportCertainty;
import site.dasibom.domain.missingcase.entity.MissingCase;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "report")
public class Report extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private MissingCase missingCase;

    // 더미 케이스용 caseId 저장
    @Column(name = "case_id", insertable = false, updatable = false)
    private Long caseId;

    @Column(nullable = false)
    private LocalDateTime reportedAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime sightedAt;

    @Column(nullable = false, length = 500)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportCertainty certainty = ReportCertainty.LIKELY;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "attachment_url", length = 500)
    private String attachmentUrl;
}