package site.dasibom.domain.missingcase.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import site.dasibom.global.common.ApiResponse;
import site.dasibom.domain.missingcase.dto.MissingCaseListResponse;
import site.dasibom.domain.missingcase.dto.MissingCaseSearchRequest;
import site.dasibom.domain.missingcase.service.MissingCaseService;

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
    public ApiResponse<Page<MissingCaseListResponse>> getMissingCases(
            @ModelAttribute MissingCaseSearchRequest request) { 
        
        Page<MissingCaseListResponse> result = service.getMissingCases(request);
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
    
    // 실종 사건 삭제 - TODO: 권한 확인 필요, 관련 신고 처리 고려
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.ok(null);
    }
    
    // 연락처 등록 - TODO: CaseContact 엔티티와 연동, 권한 확인 필요
    @PostMapping("/{caseId}/contacts")
    public ApiResponse<Void> addContact(@PathVariable Long caseId, @RequestBody ContactRequest req) {
        service.addContact(caseId, req);
        return ApiResponse.ok(null);
    }
    
    // 이동 예측 조회 - TODO: AI 모델 연동 필요
    @GetMapping("/{caseId}/prediction")
    public ApiResponse<PredictionResponse> getPrediction(@PathVariable Long caseId) {
        return ApiResponse.ok(service.getPrediction(caseId));
    }
    
    // 예측 저장 - TODO: MovementPrediction 엔티티와 연동, AI 모델에서 받은 데이터 처리
    @PostMapping("/{caseId}/predictions")
    public ApiResponse<Void> savePrediction(@PathVariable Long caseId, @RequestBody PredictionRequest req) {
        service.savePrediction(caseId, req);
        return ApiResponse.ok(null);
    }
    
    // DTO records - TODO: 별도 파일로 분리 고려
    public record ContactRequest(String name, String phone, String relationship) {}
    public record PredictionRequest(Double lat, Double lon, Double confidence, String timeframe) {}
    public record PredictionResponse(Double lat, Double lon, Double confidence, String timeframe) {}
}