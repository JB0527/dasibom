package site.dasibom.domain.external.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import site.dasibom.domain.external.dto.Safe182Response;
// import site.dasibom.domain.external.dto.Safe182FindChildRequest;
// import site.dasibom.domain.external.dto.Safe182FindChildResponse;
import site.dasibom.domain.external.service.Safe182Service;
import site.dasibom.domain.missingcase.entity.MissingCase;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/external/safe182")
@RequiredArgsConstructor
public class Safe182Controller {
    
    private final Safe182Service safe182Service;
    
    /**
     * Safe182 API에서 실종자 데이터 동기화
     */
    @PostMapping("/sync")
    public ResponseEntity<?> syncMissingPersons() {
        try {
            List<MissingCase> syncedCases = safe182Service.syncMissingPersonsFromSafe182();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "syncedCount", syncedCases.size(),
                    "cases", syncedCases
                ),
                "message", "Safe182 데이터 동기화가 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("Safe182 데이터 동기화 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "데이터 동기화 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Safe182 API로 실종자 검색
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchMissingPersons(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String gender, // "1": 남자, "2": 여자
            @RequestParam(required = false) Integer ageFrom,
            @RequestParam(required = false) Integer ageTo
    ) {
        try {
            Safe182Response response = safe182Service.searchMissingPersons(name, gender, ageFrom, ageTo);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response,
                "message", "검색이 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("Safe182 실종자 검색 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "검색 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Safe182 API로 실종자 목록 조회 (기본값 사용)
     */
    @GetMapping("/missing-persons")
    public ResponseEntity<?> getMissingPersonsList() {
        try {
            Safe182Response response = safe182Service.getDefaultMissingPersonsList();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "totalCount", response.getTotalCount(),
                    "list", response.getList(),
                    "resultCode", response.getResult(),
                    "message", response.getMsg()
                ),
                "message", "Safe182 실종자 목록 조회 성공"
            ));
            
        } catch (Exception e) {
            log.error("Safe182 실종자 목록 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "목록 조회 실패: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Safe182 API 연결 테스트
     */
    @GetMapping("/test")
    public ResponseEntity<?> testApiConnection() {
        try {
            Safe182Response response = safe182Service.searchMissingPersons(null, null, null, null);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "totalCount", response.getTotalCount(),
                    "resultCode", response.getResult(),
                    "message", response.getMsg()
                ),
                "message", "Safe182 API 연결 테스트 성공"
            ));
            
        } catch (Exception e) {
            log.error("Safe182 API 연결 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "API 연결 실패: " + e.getMessage()
            ));
        }
    }
    
    // ===============================
    // Safe182 FindChildList API 관련 엔드포인트들 (사용 안함 - amberList만 사용)
    // ===============================
    
    /*
    /**
     * Safe182 FindChildList API에서 실종아동 데이터 동기화
     */
    /*
    @PostMapping("/children/sync")
    public ResponseEntity<?> syncMissingChildren() {
        try {
            List<MissingCase> syncedCases = safe182Service.syncMissingChildrenFromSafe182();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "syncedCount", syncedCases.size(),
                    "cases", syncedCases
                ),
                "message", "Safe182 실종아동 데이터 동기화가 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("Safe182 실종아동 데이터 동기화 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "실종아동 데이터 동기화 실패: " + e.getMessage()
            ));
        }
    }
    */
    
    /*
    /**
     * Safe182 FindChildList API로 실종아동 목록 조회 (기본값 사용)
     */
    /*
    @GetMapping("/children")
    public ResponseEntity<?> getMissingChildrenList() {
        try {
            Safe182FindChildResponse response = safe182Service.getDefaultMissingChildrenList();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "totalCount", response.getTotalCount(),
                    "list", response.getList(),
                    "resultCode", response.getResult(),
                    "message", response.getMsg()
                ),
                "message", "Safe182 실종아동 목록 조회 성공"
            ));
            
        } catch (Exception e) {
            log.error("Safe182 실종아동 목록 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "실종아동 목록 조회 실패: " + e.getMessage()
            ));
        }
    }
    */
    
    /*
    /**
     * Safe182 FindChildList API로 실종아동 검색
     */
    /*
    @GetMapping("/children/search")
    public ResponseEntity<?> searchMissingChildren(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String gender, // "1": 남자, "2": 여자
            @RequestParam(required = false) Integer ageFrom,
            @RequestParam(required = false) Integer ageTo
    ) {
        try {
            Safe182FindChildResponse response = safe182Service.searchMissingChildren(name, gender, ageFrom, ageTo);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response,
                "message", "실종아동 검색이 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("Safe182 실종아동 검색 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "실종아동 검색 실패: " + e.getMessage()
            ));
        }
    }
    */
    
    /*
    /**
     * Safe182 FindChildList API 고급 검색
     */
    /*
    @PostMapping("/children/advanced-search")
    public ResponseEntity<?> advancedSearchChildren(@RequestBody Safe182FindChildRequest request) {
        try {
            Safe182FindChildResponse response = safe182Service.advancedSearchChildren(request);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response,
                "message", "실종아동 고급 검색이 완료되었습니다."
            ));
            
        } catch (Exception e) {
            log.error("Safe182 실종아동 고급 검색 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "실종아동 고급 검색 실패: " + e.getMessage()
            ));
        }
    }
    */
    
    /*
    /**
     * Safe182 FindChildList API 연결 테스트
     */
    /*
    @GetMapping("/children/test")
    public ResponseEntity<?> testChildrenApiConnection() {
        try {
            Safe182FindChildResponse response = safe182Service.searchMissingChildren(null, null, null, null);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "totalCount", response.getTotalCount(),
                    "resultCode", response.getResult(),
                    "message", response.getMsg()
                ),
                "message", "Safe182 FindChildList API 연결 테스트 성공"
            ));
            
        } catch (Exception e) {
            log.error("Safe182 FindChildList API 연결 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "FindChildList API 연결 실패: " + e.getMessage()
            ));
        }
    }
    */
}