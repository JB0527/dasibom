package site.dasibom.domain.external.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class Safe182Response {
    private String result;        // 리턴 코드
    private String msg;          // 정상
    private Integer totalCount;  // 전체 게시물 수
    private List<Safe182MissingPerson> list;  // 게시물 리스트

    @Getter
    @NoArgsConstructor
    public static class Safe182MissingPerson {
        // 기본 정보
        private String occrde;              // 발생일시 (20120916)
        @JsonProperty("alldressingDscd")
        private String alldressingDscd;     // 착의사항 (정장차림, 군복차림, 작업복차림 등)
        private String ageNow;              // 현재나이 (21)
        private String age;                 // 당시나이 (18)
        
        // 신체 정보
        @JsonProperty("writngTrgetDscd")
        private String writngTrgetDscd;     // 대상구분 (010: 정상아동 등)
        @JsonProperty("sexdstnDscd")
        private String sexdstnDscd;         // 성별구분 (여자, 남자)
        @JsonProperty("occrAdres")
        private String occrAdres;           // 발생장소 (서울시 성북구 정릉동)
        private String nm;                  // 성명 (홍길동)
        private String height;              // 키 (160)
        private String bdwgh;               // 몸무게 (45)
        
        // 외모 특징
        @JsonProperty("frmDscd")
        private String frmDscd;             // 체격 (보통)
        @JsonProperty("faceshpeDscd")
        private String faceshpeDscd;        // 계란형 등
        @JsonProperty("hairshpeDscd")
        private String hairshpeDscd;        // 스포츠형 등
        @JsonProperty("haircolrDscd")
        private String haircolrDscd;        // 흑색 등
        
        // 사진 정보
        @JsonProperty("tknphotolength")
        private String tknphotolength;      // 사진크기 (1234)
        private String fileUrl;             // 사진 URL
        
        // 추가 정보
        private String etcSpfeatr;          // 신체특징
    }
}