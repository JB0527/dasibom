package site.dasibom.domain.missingcase.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.missingcase.dto.MissingCaseListResponse;
import site.dasibom.domain.missingcase.dto.MissingCaseSearchRequest;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.external.service.Safe182Service;

import java.util.List;

@Slf4j
@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class MissingCaseService {
    private final MissingCaseRepository repo;
    private final Safe182Service safe182Service;

    
    /**
     * 실종 사건 목록 조회 (Safe182 API 호출 후 DB 저장)
     */
    @Transactional
    public Page<MissingCaseListResponse> getMissingCases(MissingCaseSearchRequest request) {
        
        // Safe182 API 호출하여 최신 데이터 동기화
        try {
            log.info("Safe182 API에서 최신 실종자 데이터 동기화 시작");
            safe182Service.syncMissingPersonsFromSafe182();
            log.info("Safe182 API 데이터 동기화 완료");
        } catch (Exception e) {
            log.error("Safe182 API 동기화 실패, 기존 DB 데이터로 조회", e);
        }
        
        // 정렬 설정
        Sort sort = createSort(request.getSortBy(), request.getSortDirection());
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        
        // 데이터베이스에서 조회
        Page<MissingCase> casePage = repo.findAll(pageable);
        
        // DTO로 변환
        return casePage.map(this::convertToListResponse);
    }
    
    /**
     * 실종 사건 상세 조회
     */
    public MissingCaseListResponse getMissingCaseDetail(Long id) {
        MissingCase missingCase = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("실종 사건을 찾을 수 없습니다. ID: " + id));
        
        return convertToListResponse(missingCase);
    }
    
    /**
     * 전체 실종 사건 개수 조회
     */
    public long getTotalCount() {
        return repo.count();
    }
    
    /**
     * 최근 실종 사건 목록 조회 (메인화면용)
     */
    public List<MissingCaseListResponse> getRecentMissingCases(int limit) {
        Pageable pageable = PageRequest.of(0, limit, 
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return repo.findAll(pageable)
                .getContent()
                .stream()
                .map(this::convertToListResponse)
                .toList();
    }
    
    /**
     * MissingCase 엔티티를 MissingCaseListResponse DTO로 변환
     */
    private MissingCaseListResponse convertToListResponse(MissingCase missingCase) {
        return MissingCaseListResponse.builder()
                .id(missingCase.getId())
                .occrde(missingCase.getOccrde())
                .nm(missingCase.getNm())
                .sexdstnDscd(missingCase.getSexdstnDscd())
                .age(missingCase.getAge())
                .ageNow(missingCase.getAgeNow())
                .wrtngTrgetDscd(missingCase.getWrtngTrgetDscd())
                .occrAdres(missingCase.getOccrAdres())
                .alldressingDscd(missingCase.getAlldressingDscd())
                .height(missingCase.getHeight())
                .bdwgh(missingCase.getBdwgh())
                .frmDscd(missingCase.getFrmDscd())
                .faceshpeDscd(missingCase.getFaceshpeDscd())
                .hairshpeDscd(missingCase.getHairshpeDscd())
                .haircolrDscd(missingCase.getHaircolrDscd())
                .tknphotolength(missingCase.getTknphotolength())
                .fileUrl(missingCase.getFileUrl())
                .occurLat(missingCase.getOccurLat())
                .occurLon(missingCase.getOccurLon())
                .caseStatus(missingCase.getCaseStatus())
                .createdAt(missingCase.getCreatedAt())
                .updatedAt(missingCase.getUpdatedAt())
                .build();
    }
    
    /**
     * 정렬 조건 생성
     */
    private Sort createSort(String sortBy, String sortDirection) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;
        
        // 허용된 정렬 필드 검증
        String validatedSortBy = switch (sortBy) {
            case "occrde", "nm", "ageNow", "caseStatus", "updatedAt" -> sortBy;
            default -> "createdAt"; // 기본값
        };
        
        return Sort.by(direction, validatedSortBy);
    }
}