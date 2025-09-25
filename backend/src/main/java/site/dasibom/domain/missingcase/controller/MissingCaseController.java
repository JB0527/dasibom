package site.dasibom.domain.missingcase.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import site.dasibom.global.common.ApiResponse;
import site.dasibom.domain.missingcase.dto.MissingCaseListResponse;
import site.dasibom.domain.missingcase.service.MissingCaseService;

import java.util.List;

@RestController 
@RequestMapping("/api/cases") 
@RequiredArgsConstructor
public class MissingCaseController {
    private final MissingCaseService service;
    
    
    @GetMapping("/{caseId}") 
    public ApiResponse<MissingCaseListResponse> getMissingCaseDetail(@PathVariable Long caseId) { 
        MissingCaseListResponse result = service.getMissingCaseDetail(caseId);
        return ApiResponse.ok(result);
    }
    
    @GetMapping 
    public ApiResponse<List<MissingCaseListResponse>> getMissingCases() { 
        
        List<MissingCaseListResponse> result = service.getMissingCases();
        return ApiResponse.ok(result);
    }
    
    
    
    
    /**
     * 전체 실종 사건 통계
     */
    @GetMapping("/stats")
    public ApiResponse<Object> getMissingCaseStats() {
        long totalCount = service.getTotalCount();
        
        return ApiResponse.ok(java.util.Map.of(
            "totalCount", totalCount,
            "message", "전체 " + totalCount + "건의 실종 사건이 등록되어 있습니다."
        ));
    }
    
    // 지도용 실종 사건 조회 - TODO: 지도에 최적화된 데이터 구조 고려 필요
    @GetMapping("/map")
    public ApiResponse<List<CaseResponse>> getForMap() {
        return ApiResponse.ok(service.list()); // 현재는 일반 목록과 동일, 추후 최적화 필요
    }

    // 실종 사건 수정 - TODO: 권한 확인 필요
    @PatchMapping("/{id}")
    public ApiResponse<CaseResponse> update(@PathVariable Long id, @RequestBody @Valid CreateCaseRequest req) {
        return ApiResponse.ok(service.update(id, req));
    }
    
    
    // DTO records - TODO: 별도 파일로 분리 고려
    public record ContactRequest(String name, String phone, String relationship) {}
    public record PredictionRequest(Double lat, Double lon, Double confidence, String timeframe) {}
    public record PredictionResponse(Double lat, Double lon, Double confidence, String timeframe) {}
}