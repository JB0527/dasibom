package site.dasibom.domain.missingcase.entity;

import jakarta.persistence.*;
import lombok.*;
import site.dasibom.global.common.BaseEntity;

import java.time.LocalDateTime;

@Getter 
@Setter 
@NoArgsConstructor
@Entity 
@Table(name = "case_contact",
       uniqueConstraints = @UniqueConstraint(columnNames = {"case_id", "phone_norm"}))
public class CaseContact extends BaseEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private MissingCase missingCase;

    @Column(length = 120)
    private String organization; // 소속/조직명
    
    @Column(nullable = false, length = 30)
    private String phoneNumber; // 원문 전화번호
    
    @Column(name = "phone_norm", length = 20, nullable = false)
    private String phoneNorm; // 정규화된 번호 (숫자만)
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String sourceUrl; // 출처 URL
    
    @Column(nullable = false, length = 300)
    private String sourceTitle; // 게시글 제목
    
    @Column(nullable = false)
    private LocalDateTime crawledAt; // 크롤링 시각
    
    private LocalDateTime lastCheckedAt; // 재검증 시각

    @PrePersist
    @PreUpdate
    private void normalizePhone() {
        if (phoneNumber != null) {
            this.phoneNorm = phoneNumber.replaceAll("\\D", "");
        }
    }
}