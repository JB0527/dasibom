package site.dasibom.domain.missingcase.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import site.dasibom.domain.common.enums.CaseStatus;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MissingCaseListResponse {
    
    private Long id;
    private String occrde;
    private String nm;
    private String sexdstnDscd;
    private Short age;
    private Short ageNow;  
    private String wrtngTrgetDscd;
    private String occrAdres;
    private String alldressingDscd;
    private Short height;
    private Short bdwgh;
    private String frmDscd;
    private String faceshpeDscd;
    private String hairshpeDscd;
    private String haircolrDscd;
    private Integer tknphotolength;
    private String fileUrl;
    private Long msspsnIdntfccd;
    private String etcSpfeatr;
    private Double occurLat;
    private Double occurLon;
    private String geocodeProvider;
    private LocalDateTime geocodedAt;
    private CaseStatus caseStatus;
    private LocalDateTime endedAt;
    private LocalDateTime lastCheckedAt;
    private LocalDateTime sourceUpdatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String aiImageUrl;
}