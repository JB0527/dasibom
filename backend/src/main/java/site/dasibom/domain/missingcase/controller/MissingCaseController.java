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
}