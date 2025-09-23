package site.dasibom.domain.missingcase.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import site.dasibom.global.common.ApiResponse;
import site.dasibom.domain.missingcase.dto.CaseResponse;
import site.dasibom.domain.missingcase.dto.CreateCaseRequest;
import site.dasibom.domain.missingcase.service.MissingCaseService;
import java.util.List;

@RestController 
@RequestMapping("/api/cases") 
@RequiredArgsConstructor
public class MissingCaseController {
    private final MissingCaseService service;
    
    @PostMapping 
    public ApiResponse<CaseResponse> create(@RequestBody @Valid CreateCaseRequest req) { 
        return ApiResponse.ok(service.create(req)); 
    }
    
    @GetMapping("/{id}") 
    public ApiResponse<CaseResponse> get(@PathVariable Long id) { 
        return ApiResponse.ok(service.get(id)); 
    }
    
    @GetMapping 
    public ApiResponse<List<CaseResponse>> list() { 
        return ApiResponse.ok(service.list()); 
    }
}