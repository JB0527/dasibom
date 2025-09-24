package site.dasibom.domain.external.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import site.dasibom.domain.external.dto.Safe182Request;
import site.dasibom.domain.external.dto.Safe182Response;
import site.dasibom.domain.external.dto.Safe182FindChildRequest;
import site.dasibom.domain.external.dto.Safe182FindChildResponse;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class Safe182ApiClient {
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${external.safe182.base-url:https://www.safe182.go.kr}")
    private String baseUrl;
    
    @Value("${external.safe182.auth-key:}")
    private String authKey;
    
    @Value("${external.safe182.esntl-id:}")
    private String esntlId;
    
    private static final String AMBER_LIST_ENDPOINT = "/api/lcm/amberList.do";
    private static final String FIND_CHILD_LIST_ENDPOINT = "/api/lcm/findChildList.do";
    
    /**
     * Safe182 실종경보 API 호출
     */
    public Safe182Response getAmberList(Safe182Request request) {
        try {
            // 필수 파라미터 설정
            if (request.getAuthKey() == null) {
                request = Safe182Request.builder()
                    .esntlId(request.getEsntlId() != null ? request.getEsntlId() : esntlId)
                    .authKey(authKey)
                    .rowSize(request.getRowSize() != null ? request.getRowSize() : 10)
                    .page(request.getPage())
                    .writngTrgetDscds(request.getWritngTrgetDscds())
                    .sexdstnDscd(request.getSexdstnDscd())
                    .nm(request.getNm())
                    .occrde(request.getOccrde())
                    .detailDate1(request.getDetailDate1())
                    .detailDate2(request.getDetailDate2())
                    .age1(request.getAge1())
                    .age2(request.getAge2())
                    .file2(request.getFile2())
                    .etcSpfeatr(request.getEtcSpfeatr())
                    .occrAdres(request.getOccrAdres())
                    .xmlUseYN(request.getXmlUseYN())
                    .build();
            }
            
            String url = baseUrl + AMBER_LIST_ENDPOINT;
            
            // POST 요청을 위한 Form Data 구성
            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("esntlId", request.getEsntlId());
            formData.add("authKey", request.getAuthKey());
            formData.add("rowSize", request.getRowSize());
            
            if (request.getPage() != null) {
                formData.add("page", request.getPage());
            }
            if (request.getWritngTrgetDscds() != null && !request.getWritngTrgetDscds().isEmpty()) {
                formData.add("writngTrgetDscds", request.getWritngTrgetDscds());
            }
            if (request.getSexdstnDscd() != null) {
                formData.add("sexdstnDscd", request.getSexdstnDscd());
            }
            if (request.getNm() != null) {
                formData.add("nm", request.getNm());
            }
            if (request.getOccrde() != null) {
                formData.add("occrde", request.getOccrde());
            }
            if (request.getDetailDate1() != null) {
                formData.add("detailDate1", request.getDetailDate1());
            }
            if (request.getDetailDate2() != null) {
                formData.add("detailDate2", request.getDetailDate2());
            }
            if (request.getAge1() != null) {
                formData.add("age1", request.getAge1());
            }
            if (request.getAge2() != null) {
                formData.add("age2", request.getAge2());
            }
            if (request.getFile2() != null) {
                formData.add("file2", request.getFile2());
            }
            if (request.getEtcSpfeatr() != null) {
                formData.add("etcSpfeatr", request.getEtcSpfeatr());
            }
            if (request.getOccrAdres() != null) {
                formData.add("occrAdres", request.getOccrAdres());
            }
            if (request.getXmlUseYN() != null) {
                formData.add("xmlUseYN", request.getXmlUseYN());
            }
            
            // 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(formData, headers);
            
            log.info("Safe182 API 요청 - URL: {}, Parameters: {}", url, formData);
            
            // API 호출
            ResponseEntity<Safe182Response> response = restTemplate.postForEntity(
                url, entity, Safe182Response.class
            );
            
            Safe182Response responseBody = response.getBody();
            
            if (responseBody != null && "00".equals(responseBody.getResult())) {
                log.info("Safe182 API 호출 성공 - 총 {}건의 데이터 조회", responseBody.getTotalCount());
                return responseBody;
            } else {
                log.error("Safe182 API 호출 실패 - Result: {}, Message: {}", 
                    responseBody != null ? responseBody.getResult() : "null",
                    responseBody != null ? responseBody.getMsg() : "null");
                throw new RuntimeException("Safe182 API 호출 실패: " + 
                    (responseBody != null ? responseBody.getMsg() : "Unknown error"));
            }
            
        } catch (Exception e) {
            log.error("Safe182 API 호출 중 오류 발생", e);
            throw new RuntimeException("Safe182 API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    /**
     * 기본 조건으로 실종자 목록 조회
     */
    public Safe182Response getAmberListDefault() {
        return getAmberList(Safe182Request.builder()
            .esntlId(esntlId)
            .authKey(authKey)
            .rowSize(10)
            .page(1)
            .build());
    }
    
    /**
     * 특정 조건으로 실종자 검색
     */
    public Safe182Response searchMissingPersons(String name, String gender, Integer ageFrom, Integer ageTo) {
        return getAmberList(Safe182Request.builder()
            .esntlId(esntlId)
            .authKey(authKey)
            .rowSize(10)
            .page(1)
            .nm(name)
            .sexdstnDscd(gender) // "1": 남자, "2": 여자
            .age1(ageFrom)
            .age2(ageTo)
            .build());
    }
    
    /**
     * 고급 검색 - 모든 조건 지원
     */
    public Safe182Response advancedSearch(String name, String gender, Integer ageFrom, Integer ageTo, 
                                        String region, String dateFrom, String dateTo, 
                                        List<String> targetTypes, Integer pageSize) {
        return getAmberList(Safe182Request.builder()
            .esntlId(esntlId)
            .authKey(authKey)
            .rowSize(pageSize != null ? pageSize : 10)
            .page(1)
            .nm(name)
            .sexdstnDscd(gender)
            .age1(ageFrom)
            .age2(ageTo)
            .occrAdres(region)
            .detailDate1(dateFrom)
            .detailDate2(dateTo)
            .writngTrgetDscds(targetTypes)
            .build());
    }
    
    /**
     * Safe182 실종아동 찾기 API 호출
     */
    public Safe182FindChildResponse getFindChildList(Safe182FindChildRequest request) {
        try {
            // 필수 파라미터 설정
            if (request.getAuthKey() == null) {
                request = Safe182FindChildRequest.builder()
                    .esntlId(request.getEsntlId() != null ? request.getEsntlId() : esntlId)
                    .authKey(authKey)
                    .rowSize(request.getRowSize() != null ? request.getRowSize() : 10)
                    .page(request.getPage())
                    .writngTrgetDscds(request.getWritngTrgetDscds())
                    .sexdstnDscd(request.getSexdstnDscd())
                    .nm(request.getNm())
                    .detailDate1(request.getDetailDate1())
                    .detailDate2(request.getDetailDate2())
                    .age1(request.getAge1())
                    .age2(request.getAge2())
                    .file2(request.getFile2())
                    .etcSpfeatr(request.getEtcSpfeatr())
                    .occrAdres(request.getOccrAdres())
                    .xmlUseYN(request.getXmlUseYN())
                    .build();
            }
            
            String url = baseUrl + FIND_CHILD_LIST_ENDPOINT;
            
            // POST 요청을 위한 Form Data 구성
            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("esntlId", request.getEsntlId());
            formData.add("authKey", request.getAuthKey());
            formData.add("rowSize", request.getRowSize());
            
            if (request.getPage() != null) {
                formData.add("page", request.getPage());
            }
            if (request.getWritngTrgetDscds() != null && !request.getWritngTrgetDscds().isEmpty()) {
                formData.add("writngTrgetDscds", request.getWritngTrgetDscds());
            }
            if (request.getSexdstnDscd() != null) {
                formData.add("sexdstnDscd", request.getSexdstnDscd());
            }
            if (request.getNm() != null) {
                formData.add("nm", request.getNm());
            }
            if (request.getDetailDate1() != null) {
                formData.add("detailDate1", request.getDetailDate1());
            }
            if (request.getDetailDate2() != null) {
                formData.add("detailDate2", request.getDetailDate2());
            }
            if (request.getAge1() != null) {
                formData.add("age1", request.getAge1());
            }
            if (request.getAge2() != null) {
                formData.add("age2", request.getAge2());
            }
            if (request.getFile2() != null) {
                formData.add("file2", request.getFile2());
            }
            if (request.getEtcSpfeatr() != null) {
                formData.add("etcSpfeatr", request.getEtcSpfeatr());
            }
            if (request.getOccrAdres() != null) {
                formData.add("occrAdres", request.getOccrAdres());
            }
            if (request.getXmlUseYN() != null) {
                formData.add("xmlUseYN", request.getXmlUseYN());
            }
            
            // 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(formData, headers);
            
            log.info("Safe182 FindChildList API 요청 - URL: {}, Parameters: {}", url, formData);
            
            // API 호출
            ResponseEntity<Safe182FindChildResponse> response = restTemplate.postForEntity(
                url, entity, Safe182FindChildResponse.class
            );
            
            Safe182FindChildResponse responseBody = response.getBody();
            
            if (responseBody != null && "00".equals(responseBody.getResult())) {
                log.info("Safe182 FindChildList API 호출 성공 - 총 {}건의 데이터 조회", responseBody.getTotalCount());
                return responseBody;
            } else {
                log.error("Safe182 FindChildList API 호출 실패 - Result: {}, Message: {}", 
                    responseBody != null ? responseBody.getResult() : "null",
                    responseBody != null ? responseBody.getMsg() : "null");
                throw new RuntimeException("Safe182 FindChildList API 호출 실패: " + 
                    (responseBody != null ? responseBody.getMsg() : "Unknown error"));
            }
            
        } catch (Exception e) {
            log.error("Safe182 FindChildList API 호출 중 오류 발생", e);
            throw new RuntimeException("Safe182 FindChildList API 호출 중 오류 발생: " + e.getMessage(), e);
        }
    }
    
    /**
     * 기본 조건으로 실종아동 목록 조회
     */
    public Safe182FindChildResponse getFindChildListDefault() {
        return getFindChildList(Safe182FindChildRequest.createDefault(esntlId, authKey));
    }
    
    /**
     * 특정 조건으로 실종아동 검색
     */
    public Safe182FindChildResponse searchMissingChildren(String name, String gender, Integer ageFrom, Integer ageTo) {
        return getFindChildList(Safe182FindChildRequest.builder()
            .esntlId(esntlId)
            .authKey(authKey)
            .rowSize(10)
            .page(1)
            .nm(name)
            .sexdstnDscd(gender) // "1": 남자, "2": 여자
            .age1(ageFrom)
            .age2(ageTo)
            .build());
    }
}