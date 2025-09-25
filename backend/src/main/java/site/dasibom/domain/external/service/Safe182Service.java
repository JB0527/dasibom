package site.dasibom.domain.external.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.external.client.Safe182ApiClient;
import site.dasibom.domain.external.dto.Safe182Response;
import site.dasibom.domain.external.dto.Safe182Request;
// import site.dasibom.domain.external.dto.Safe182FindChildRequest;
// import site.dasibom.domain.external.dto.Safe182FindChildResponse;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.common.enums.CaseStatus;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class Safe182Service {
    
    private final Safe182ApiClient safe182ApiClient;
    private final MissingCaseRepository missingCaseRepository;
    
    /**
     * Safe182 API에서 실종자 데이터를 가져와서 DB에 저장
     */
    @Transactional
    public List<MissingCase> syncMissingPersonsFromSafe182() {
        try {
            log.info("Safe182 API에서 실종자 데이터 동기화 시작");
            
            // API 호출
            Safe182Response response = safe182ApiClient.getAmberListDefault();
            
            if (response.getList() == null || response.getList().isEmpty()) {
                log.info("Safe182 API에서 가져온 데이터가 없습니다.");
                return List.of();
            }
            
            // 응답 데이터를 MissingCase 엔티티로 변환 및 저장
            List<MissingCase> savedCases = response.getList().stream()
                .map(this::convertToMissingCase)
                .map(this::saveOrUpdateMissingCase)
                .collect(Collectors.toList());
            
            log.info("Safe182 데이터 동기화 완료 - 총 {}건 처리", savedCases.size());
            return savedCases;
            
        } catch (Exception e) {
            log.error("Safe182 데이터 동기화 중 오류 발생", e);
            throw new RuntimeException("Safe182 데이터 동기화 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * Safe182 응답 데이터를 MissingCase 엔티티로 변환
     */
    private MissingCase convertToMissingCase(Safe182Response.Safe182MissingPerson person) {
        MissingCase missingCase = new MissingCase();
        
        // 기본 정보
        missingCase.setOccrde(person.getOccrde());
        missingCase.setNm(person.getNm());
        missingCase.setSexdstnDscd(person.getSexdstnDscd());
        
        // 나이 정보
        if (person.getAge() != null) {
            try {
                missingCase.setAge(Short.valueOf(person.getAge()));
            } catch (NumberFormatException e) {
                log.warn("나이 변환 실패: {}", person.getAge());
            }
        }
        if (person.getAgeNow() != null) {
            try {
                missingCase.setAgeNow(Short.valueOf(person.getAgeNow()));
            } catch (NumberFormatException e) {
                log.warn("현재나이 변환 실패: {}", person.getAgeNow());
            }
        }
        
        // 대상구분
        missingCase.setWrtngTrgetDscd(person.getWritngTrgetDscd());
        
        // 발생장소
        missingCase.setOccrAdres(person.getOccrAdres());
        
        // 착의사항
        missingCase.setAlldressingDscd(person.getAlldressingDscd());
        
        // 신체정보
        if (person.getHeight() != null) {
            try {
                missingCase.setHeight(Short.valueOf(person.getHeight()));
            } catch (NumberFormatException e) {
                log.warn("키 변환 실패: {}", person.getHeight());
            }
        }
        if (person.getBdwgh() != null) {
            try {
                missingCase.setBdwgh(Short.valueOf(person.getBdwgh()));
            } catch (NumberFormatException e) {
                log.warn("몸무게 변환 실패: {}", person.getBdwgh());
            }
        }
        
        // 외모 특징
        missingCase.setFrmDscd(person.getFrmDscd());
        missingCase.setFaceshpeDscd(person.getFaceshpeDscd());
        missingCase.setHairshpeDscd(person.getHairshpeDscd());
        missingCase.setHaircolrDscd(person.getHaircolrDscd());
        
        // 사진 정보
        if (person.getTknphotolength() != null) {
            try {
                missingCase.setTknphotolength(Integer.valueOf(person.getTknphotolength()));
            } catch (NumberFormatException e) {
                log.warn("사진크기 변환 실패: {}", person.getTknphotolength());
            }
        }
        
        // 실종자식별코드 저장
        missingCase.setMsspsnIdntfccd(person.getMsspsnIdntfccd());
        
        // 사진 URL 생성 (사진이 있는 경우에만)
        if (person.getTknphotolength() != null && !"0".equals(person.getTknphotolength()) 
            && person.getMsspsnIdntfccd() != null) {
            String photoUrl = "https://www.safe182.go.kr/api/lcm/imgView.do?msspsnIdntfccd=" + person.getMsspsnIdntfccd();
            missingCase.setFileUrl(photoUrl);
        }
        
        // 신체특징
        missingCase.setEtcSpfeatr(person.getEtcSpfeatr());
        
        // 운영 메타 정보
        missingCase.setCaseStatus(CaseStatus.OPEN);
        missingCase.setSourceUpdatedAt(LocalDateTime.now());
        missingCase.setLastCheckedAt(LocalDateTime.now());
        
        return missingCase;
    }
    
    /**
     * MissingCase 저장 또는 업데이트
     * 발생일자와 이름으로 중복 체크
     */
    private MissingCase saveOrUpdateMissingCase(MissingCase missingCase) {
        // 발생일자와 이름으로 기존 케이스 검색
        MissingCase existingCase = missingCaseRepository
            .findByOccrdeAndNm(missingCase.getOccrde(), missingCase.getNm());
        
        if (existingCase != null) {
            // 기존 케이스 업데이트
            updateExistingCase(existingCase, missingCase);
            log.debug("기존 실종자 케이스 업데이트: {} ({})", missingCase.getNm(), missingCase.getOccrde());
            return missingCaseRepository.save(existingCase);
        } else {
            // 새 케이스 저장
            log.debug("새로운 실종자 케이스 저장: {} ({})", missingCase.getNm(), missingCase.getOccrde());
            return missingCaseRepository.save(missingCase);
        }
    }
    
    /**
     * 기존 케이스 정보 업데이트
     */
    private void updateExistingCase(MissingCase existing, MissingCase newData) {
        existing.setAgeNow(newData.getAgeNow());
        existing.setFileUrl(newData.getFileUrl());
        existing.setTknphotolength(newData.getTknphotolength());
        existing.setMsspsnIdntfccd(newData.getMsspsnIdntfccd()); // 실종자식별코드 업데이트 추가
        existing.setSourceUpdatedAt(LocalDateTime.now());
        existing.setLastCheckedAt(LocalDateTime.now());
        
        // 필요시 다른 필드들도 업데이트
        if (newData.getOccrAdres() != null) {
            existing.setOccrAdres(newData.getOccrAdres());
        }
        if (newData.getAlldressingDscd() != null) {
            existing.setAlldressingDscd(newData.getAlldressingDscd());
        }
    }
    
    /**
     * 특정 조건으로 실종자 검색
     */
    public Safe182Response searchMissingPersons(String name, String gender, Integer ageFrom, Integer ageTo) {
        return safe182ApiClient.searchMissingPersons(name, gender, ageFrom, ageTo);
    }
    
    /**
     * 고급 검색 - 모든 파라미터 지원
     */
    public Safe182Response advancedSearch(Safe182Request request) {
        return safe182ApiClient.getAmberList(request);
    }
    
    /**
     * 기본 실종자 목록 조회
     */
    public Safe182Response getDefaultMissingPersonsList() {
        return safe182ApiClient.getAmberListDefault();
    }
    
    // ===============================
    // Safe182 FindChildList API 관련 메소드들 (사용 안함 - amberList만 사용)
    // ===============================
    
    /*
    /**
     * Safe182 FindChildList API에서 실종아동 데이터를 가져와서 DB에 저장
     */
    /*
    @Transactional
    public List<MissingCase> syncMissingChildrenFromSafe182() {
        try {
            log.info("Safe182 FindChildList API에서 실종아동 데이터 동기화 시작");
            
            // API 호출
            Safe182FindChildResponse response = safe182ApiClient.getFindChildListDefault();
            
            if (response.getList() == null || response.getList().isEmpty()) {
                log.info("Safe182 FindChildList API에서 가져온 데이터가 없습니다.");
                return List.of();
            }
            
            // 응답 데이터를 MissingCase 엔티티로 변환 및 저장
            List<MissingCase> savedCases = response.getList().stream()
                .map(this::convertFindChildToMissingCase)
                .map(this::saveOrUpdateMissingCase)
                .collect(Collectors.toList());
            
            log.info("Safe182 FindChildList 데이터 동기화 완료 - 총 {}건 처리", savedCases.size());
            return savedCases;
            
        } catch (Exception e) {
            log.error("Safe182 FindChildList 데이터 동기화 중 오류 발생", e);
            throw new RuntimeException("Safe182 FindChildList 데이터 동기화 실패: " + e.getMessage(), e);
        }
    }
    */
    
    /*
    /**
     * Safe182 FindChild 응답 데이터를 MissingCase 엔티티로 변환
     */
    /*
    private MissingCase convertFindChildToMissingCase(Safe182FindChildResponse.Safe182FindChild child) {
        MissingCase missingCase = new MissingCase();
        
        // 기본 정보
        missingCase.setOccrde(child.getOccrde());
        missingCase.setNm(child.getNm());
        missingCase.setSexdstnDscd(child.getSexdstnDscd());
        
        // 나이 정보
        if (child.getAge() != null) {
            try {
                missingCase.setAge(Short.valueOf(child.getAge()));
            } catch (NumberFormatException e) {
                log.warn("나이 변환 실패: {}", child.getAge());
            }
        }
        if (child.getAgeNow() != null) {
            try {
                missingCase.setAgeNow(Short.valueOf(child.getAgeNow()));
            } catch (NumberFormatException e) {
                log.warn("현재나이 변환 실패: {}", child.getAgeNow());
            }
        }
        
        // 대상구분
        missingCase.setWrtngTrgetDscd(child.getWritngTrgetDscd());
        
        // 발생장소
        missingCase.setOccrAdres(child.getOccrAdres());
        
        // 착의사항
        missingCase.setAlldressingDscd(child.getAlldressingDscd());
        
        // 신체정보 (FindChild API에서는 tknphotolength가 키, bdwgh가 사진크기로 되어있음)
        if (child.getTknphotolength() != null) {
            try {
                missingCase.setHeight(Short.valueOf(child.getTknphotolength()));
            } catch (NumberFormatException e) {
                log.warn("키 변환 실패: {}", child.getTknphotolength());
            }
        }
        if (child.getBdwgh() != null) {
            try {
                missingCase.setBdwgh(Short.valueOf(child.getBdwgh()));
            } catch (NumberFormatException e) {
                log.warn("몸무게 변환 실패: {}", child.getBdwgh());
            }
        }
        
        // 외모 특징
        missingCase.setFrmDscd(child.getFrmDscd());
        missingCase.setFaceshpeDscd(child.getFaceshpeDscd());
        missingCase.setHairshpeDscd(child.getHairshpeDscd());
        missingCase.setHaircolrDscd(child.getHaircolrDscd());
        
        // 사진 정보
        missingCase.setFileUrl(child.getFileUrl());
        
        // 신체특징
        missingCase.setEtcSpfeatr(child.getEtcSpfeatr());
        
        // 운영 메타 정보
        missingCase.setCaseStatus(CaseStatus.OPEN);
        missingCase.setSourceUpdatedAt(LocalDateTime.now());
        missingCase.setLastCheckedAt(LocalDateTime.now());
        
        return missingCase;
    }
    */
    
    /*
    /**
     * 특정 조건으로 실종아동 검색
     */
    /*
    public Safe182FindChildResponse searchMissingChildren(String name, String gender, Integer ageFrom, Integer ageTo) {
        return safe182ApiClient.searchMissingChildren(name, gender, ageFrom, ageTo);
    }
    
    /**
     * 고급 검색 - 모든 파라미터 지원 (FindChild)
     */
    /*
    public Safe182FindChildResponse advancedSearchChildren(Safe182FindChildRequest request) {
        return safe182ApiClient.getFindChildList(request);
    }
    
    /**
     * 기본 실종아동 목록 조회
     */
    /*
    public Safe182FindChildResponse getDefaultMissingChildrenList() {
        return safe182ApiClient.getFindChildListDefault();
    }
    */
}