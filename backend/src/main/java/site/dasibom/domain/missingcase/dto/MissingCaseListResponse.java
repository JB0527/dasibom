package site.dasibom.domain.missingcase.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import site.dasibom.domain.common.enums.CaseStatus;

import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MissingCaseListResponse {
    
    private Long id;
    private String occrde;              // 발생일자
    private String nm;                  // 이름
    private String sexdstnDscd;         // 성별
    private Short age;                  // 당시나이
    private Short ageNow;               // 현재나이  
    private String wrtngTrgetDscd;      // 대상구분코드
    private String occrAdres;           // 발생장소
    private String alldressingDscd;     // 착의사항
    private Short height;               // 키
    private Short bdwgh;                // 몸무게
    private String frmDscd;             // 체격
    private String faceshpeDscd;        // 얼굴형
    private String hairshpeDscd;        // 머리모양
    private String haircolrDscd;        // 머리색상
    private Integer tknphotolength;     // 사진크기
    private String fileUrl;             // 사진URL
    private String etcSpfeatr;          // 신체특징
    private Double occurLat;            // 위도
    private Double occurLon;            // 경도
    private CaseStatus caseStatus;      // 케이스상태
    private LocalDateTime createdAt;    // 등록일시
    private LocalDateTime updatedAt;    // 수정일시
    
    /**
     * 대상구분코드를 한글명으로 변환
     */
    public String getTargetTypeName() {
        if (wrtngTrgetDscd == null) return "미분류";
        
        return switch (wrtngTrgetDscd) {
            case "010" -> "청소년(18세미만)";
            case "061" -> "지적장애인(18세미만)"; 
            case "062" -> "지적장애인(18세이상)";
            case "070" -> "치매질환자";
            default -> "기타";
        };
    }
    
    /**
     * 성별을 한글명으로 변환
     */
    public String getGenderName() {
        if (sexdstnDscd == null) return "미상";
        return "남자".equals(sexdstnDscd) ? "남자" : "여자";
    }
    
    /**
     * 케이스 상태를 한글명으로 변환
     */
    public String getCaseStatusName() {
        if (caseStatus == null) return "미상";
        
        return switch (caseStatus) {
            case OPEN -> "수색중";
            case CLOSED -> "해결됨";
            case SUSPENDED -> "중단됨";
        };
    }
}