package site.dasibom.domain.missingcase.entity;

import jakarta.persistence.*;
import lombok.*;
import site.dasibom.global.common.BaseEntity;
import site.dasibom.domain.common.enums.CaseStatus;
// import org.locationtech.jts.geom.Point;
// import org.hibernate.annotations.Formula;

import java.time.LocalDateTime;

@Getter 
@Setter 
@NoArgsConstructor
@Entity 
@Table(name="missing_case")
public class MissingCase extends BaseEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // SAFE182 API 필드들
    @Column(length = 8)
    private String occrde; // 발생일자(YYYYMMDD)
    
    @Column(length = 50)
    private String nm; // 이름
    
    @Column(length = 2)
    private String sexdstnDscd; // 성별구분코드
    
    private Short age; // 당시 나이
    private Short ageNow; // 현재 나이
    
    @Column(length = 3)
    private String wrtngTrgetDscd; // 대상구분코드
    
    @Column(length = 255)
    private String occrAdres; // 발생장소
    
    @Column(length = 100)
    private String alldressingDscd; // 착의사항
    
    private Short height; // 키
    private Short bdwgh; // 몸무게
    
    @Column(length = 50)
    private String frmDscd; // 체격
    
    @Column(length = 50)
    private String faceshpeDscd; // 얼굴형
    
    @Column(length = 50)
    private String hairshpeDscd; // 두발형태
    
    @Column(length = 50)
    private String haircolrDscd; // 두발색상
    
    private Integer tknphotolength; // 사진크기
    
    @Column(columnDefinition = "TEXT")
    private String fileUrl; // 사진URL
    
    private Long msspsnIdntfccd; // 실종자식별코드
    
    @Column(columnDefinition = "TEXT")
    private String etcSpfeatr; // 신체특징

    // 좌표 (PostGIS 없이 일반 필드로)
    private Double occurLat; // 위도
    private Double occurLon; // 경도
    
    @Column(length = 20)
    private String geocodeProvider; // 지오코딩제공자
    
    private LocalDateTime geocodedAt; // 지오코딩시각

    // 운영 메타
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaseStatus caseStatus = CaseStatus.OPEN;
    
    private LocalDateTime endedAt; // 해제시각
    private LocalDateTime lastCheckedAt; // 마지막폴링확인
    private LocalDateTime sourceUpdatedAt; // 원본갱신시각

    @Column(columnDefinition = "TEXT")
    private String aiImageUrl; // AI 생성 이미지 URL
}