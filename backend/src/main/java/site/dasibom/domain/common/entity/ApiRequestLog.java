package site.dasibom.domain.common.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter 
@Setter 
@NoArgsConstructor
@Entity 
@Table(name = "api_request_logs")
public class ApiRequestLog {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint; // 호출 API 엔드포인트
    
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode params; // 요청 파라미터 (JSON)
    
    private Integer statusCode; // HTTP 상태코드
    
    private Integer resultCount; // 응답 데이터 건수
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage; // 실패 시 에러 메시지
    
    @Column(nullable = false)
    private LocalDateTime requestedAt = LocalDateTime.now(); // 요청 시각
    
    private LocalDateTime respondedAt; // 응답 시각
}