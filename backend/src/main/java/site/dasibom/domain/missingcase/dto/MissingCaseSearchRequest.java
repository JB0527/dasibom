package site.dasibom.domain.missingcase.dto;

import lombok.Getter;
import lombok.Setter;
import site.dasibom.domain.common.enums.CaseStatus;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Getter
@Setter
public class MissingCaseSearchRequest {
    
    // 페이지네이션
    @Min(value = 0, message = "페이지는 0 이상이어야 합니다.")
    private int page = 0;
    
    @Min(value = 1, message = "페이지 크기는 1 이상이어야 합니다.")
    @Max(value = 100, message = "페이지 크기는 100 이하여야 합니다.")
    private int size = 20;
    
    // 검색 조건
    private String name;                // 이름 (부분검색)
    private String gender;              // 성별 ("남자", "여자")
    private String targetType;          // 대상구분 ("010", "061", "062", "070")
    private Short ageFrom;              // 현재나이 시작
    private Short ageTo;                // 현재나이 끝
    private String location;            // 발생장소 (부분검색)
    private CaseStatus caseStatus;      // 케이스상태
    
    // 정렬
    private String sortBy = "createdAt"; // 정렬 필드 (createdAt, occrde, ageNow 등)
    private String sortDirection = "DESC"; // 정렬 방향 (ASC, DESC)
    
    /**
     * 검색 조건이 있는지 확인
     */
    public boolean hasSearchCondition() {
        return (name != null && !name.trim().isEmpty()) ||
               (gender != null && !gender.trim().isEmpty()) ||
               (targetType != null && !targetType.trim().isEmpty()) ||
               ageFrom != null ||
               ageTo != null ||
               (location != null && !location.trim().isEmpty()) ||
               caseStatus != null;
    }
}