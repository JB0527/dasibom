package site.dasibom.domain.external.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Getter
@NoArgsConstructor
@ToString
public class Safe182FindChildResponse {
    
    private String result;      // RETURN CODE (00: 정상, 80: 일일 조회 건수 초과, 99: 각 누락 항목)
    private String msg;         // RETURN MESSAGE
    private Integer totalCount; // 전체 게시물 수
    private List<Safe182FindChild> list; // 게시물 리스트
    
    @Getter
    @NoArgsConstructor  
    @ToString
    public static class Safe182FindChild {
        
        @JsonProperty("occrde")
        private String occrde;                   // 발생일시 (20120916)
        
        @JsonProperty("alldressingDscd")
        private String alldressingDscd;          // 착의사항 (복상)
        
        @JsonProperty("ageNow")
        private String ageNow;                   // 현재나이 (21)
        
        @JsonProperty("age")
        private String age;                      // 당시나이 (18)
        
        @JsonProperty("writngTrgetDscd")
        private String writngTrgetDscd;          // 대상구분 (010: 청소년(18세미만), 020: 가출인, 040: 시설보호무연고자, 060: 지적장애인, 061: 지적장애인(18세미만), 062: 지적장애인(18세이상), 070: 치매질환자, 080: 불상(기타))
        
        @JsonProperty("sexdstnDscd")
        private String sexdstnDscd;              // 성별구분 (여자, 남자)
        
        @JsonProperty("occrAdres")
        private String occrAdres;                // 발생장소 (서울시 성북구 정릉동)
        
        @JsonProperty("nm")
        private String nm;                       // 성명 (홍길동)
        
        @JsonProperty("tknphotolength")
        private String tknphotolength;           // 키 (1234)
        
        @JsonProperty("bdwgh")
        private String bdwgh;                    // 사진크기 (45)
        
        // 추가 필드들 (스크린샷에는 없지만 실제 응답에 포함될 수 있는 필드들)
        @JsonProperty("height")
        private String height;                   // 키
        
        @JsonProperty("frmDscd")
        private String frmDscd;                  // 체격
        
        @JsonProperty("faceshpeDscd")
        private String faceshpeDscd;             // 얼굴형
        
        @JsonProperty("hairshpeDscd")
        private String hairshpeDscd;             // 두발형태
        
        @JsonProperty("haircolrDscd")
        private String haircolrDscd;             // 두발색상
        
        @JsonProperty("fileUrl")
        private String fileUrl;                  // 사진URL
        
        @JsonProperty("etcSpfeatr")
        private String etcSpfeatr;               // 신체특징
    }
}