package site.dasibom.domain.missingcase.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.domain.common.enums.CaseStatus;

import java.util.List;

public interface MissingCaseRepository extends JpaRepository<MissingCase, Long> { 
    
    /**
     * 발생일자와 이름으로 실종자 케이스 검색 (Safe182 API 중복 체크용)
     */
    List<MissingCase> findByOccrdeAndNm(String occrde, String nm);
    
    /**
     * 케이스 상태로 실종자 케이스 검색 (자동 종료 처리용)
     */
    List<MissingCase> findByCaseStatus(CaseStatus caseStatus);
    
    /**
     * 이름으로 실종자 케이스 검색
     */
    List<MissingCase> findByNmContaining(String nm);
    
    /**
     * 성별로 실종자 케이스 검색
     */
    List<MissingCase> findBySexdstnDscd(String sexdstnDscd);
    
    /**
     * 나이 범위로 실종자 케이스 검색
     */
    @Query("SELECT m FROM MissingCase m WHERE m.ageNow BETWEEN :ageFrom AND :ageTo")
    List<MissingCase> findByAgeNowBetween(@Param("ageFrom") Short ageFrom, @Param("ageTo") Short ageTo);
    
    /**
     * 발생장소로 실종자 케이스 검색
     */
    List<MissingCase> findByOccrAdresContaining(String occrAdres);
}