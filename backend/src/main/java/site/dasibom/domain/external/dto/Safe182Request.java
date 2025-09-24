package site.dasibom.domain.external.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Safe182Request {
    private String esntlId;          // 고유아이디 (필수)
    private String authKey;          // 인증키 (필수)
    private Integer rowSize;         // 게시물 수 (필수, 최대 10개)
    private Integer page;            // 페이지 (선택)
    
    // 검색 조건들 (선택)
    private List<String> writngTrgetDscds;  // 대상 (010: 정상아동, 020: 가출인, 등)
    private String sexdstnDscd;      // 성별 (1: 남자, 2: 여자)
    private String nm;               // 이름
    private String occrde;           // 발생일 (최대 8자)
    private String detailDate1;      // 시작 발생일 (2012-08-17 형식)
    private String detailDate2;      // 종료 발생일 (2012-08-18 형식)
    private Integer age1;            // 시작 당시나이 (최대 3자)
    private Integer age2;            // 종료 당시나이 (최대 3자)
    private String file2;            // 실종아동사진 (200KB만)
    private String etcSpfeatr;       // 신체특징
    private String occrAdres;        // 발생장소
    private String xmlUseYN;         // xml사용여부
}