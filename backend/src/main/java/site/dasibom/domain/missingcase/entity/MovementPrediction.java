package site.dasibom.domain.missingcase.entity;

import jakarta.persistence.*;
import lombok.*;
import site.dasibom.global.common.BaseEntity;
// import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter 
@Setter 
@NoArgsConstructor
@Entity 
@Table(name = "movement_prediction")
public class MovementPrediction extends BaseEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private MissingCase missingCase;

    @Column(length = 40)
    private String modelVersion; // 모델 버전
    
    private Double centerLat; // 중심 위도
    private Double centerLon; // 중심 경도
    
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal speedKmh; // 속도(km/h)
    
    @Column(nullable = false)
    private Integer horizonHours = 24; // 예측 시간(기본 24시간)
    
    @Column(nullable = false)
    private LocalDateTime predictedAt = LocalDateTime.now(); // 예측 생성 시각

    @PrePersist
    @PreUpdate
    private void validateHorizionHours() {
        if (horizonHours < 1 || horizonHours > 72) {
            throw new IllegalArgumentException("horizonHours must be between 1 and 72");
        }
        if (speedKmh.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("speedKmh must be greater than 0");
        }
    }
}