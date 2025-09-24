package site.dasibom.domain.external.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Safe182FindChildRequest {
    
    // 필수 파라미터
    private String esntlId;      // 고유아이디 (필수)
    private String authKey;      // 인증키 (필수) 
    private Integer rowSize;     // 게시물 수 (필수, 최대 100개)
    
    // 선택 파라미터
    private Integer page;        // 페이지 (선택)
    
    private List<String> writngTrgetDscds; // 대상 (선택)
    // 청소년(18세미만) : 010, 지적장애인 : 060, 치매질환자 : 070, 기타 : 080
    
    private String sexdstnDscd;  // 성별 (선택) - 남자:1, 여자:2
    
    private String nm;           // 이름 (선택, 10자)
    
    private String detailDate1;  // 시작 발생일 (선택, 2012-08-17 형태, 10자)
    private String detailDate2;  // 종료 발생일 (선택, 2012-08-18 형태, 10자)
    
    private Integer age1;        // 시작 당시나이 (선택, 3자)
    private Integer age2;        // 종료 당시나이 (선택, 3자)
    
    private String file2;        // 실종아동사진 (선택, 200K미만)
    
    private String etcSpfeatr;   // 신체특징 (선택, 330자)
    
    private String occrAdres;    // 발생장소 (선택, 100자)
    
    private String xmlUseYN;     // xml사용여부 (선택)
    
    public static Safe182FindChildRequest createDefault(String esntlId, String authKey) {
        return Safe182FindChildRequest.builder()
            .esntlId(esntlId)
            .authKey(authKey)
            .rowSize(10)
            .page(1)
            .build();
    }
}