package site.dasibom.domain.missingcase.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.missingcase.dto.MissingCaseListResponse;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.external.service.Safe182Service;
import site.dasibom.global.util.S3UrlConverter;
import site.dasibom.domain.common.enums.CaseStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class MissingCaseService {
    private final MissingCaseRepository repo;
    private final Safe182Service safe182Service;
    private final S3UrlConverter s3UrlConverter;

    
    /**
     * 실종 사건 목록 조회 (Safe182 API 호출 후 DB 저장)
     */
    @Transactional
    public List<MissingCaseListResponse> getMissingCases() {
        
        // Safe182 API 호출하여 최신 데이터 동기화
        try {
            log.info("Safe182 API에서 최신 실종자 데이터 동기화 시작");
            safe182Service.syncMissingPersonsFromSafe182();
            log.info("Safe182 API 데이터 동기화 완료");
        } catch (Exception e) {
            log.error("Safe182 API 동기화 실패, 기존 DB 데이터로 조회", e);
        }
        
        // 데이터베이스에서 전체 조회
        List<MissingCase> cases = repo.findAll();

        // DTO로 변환
        List<MissingCaseListResponse> result = new ArrayList<>(cases.stream()
                .map(this::convertToListResponse)
                .toList());

        // 더미데이터 추가
        result.addAll(getDummyData());

        return result;
    }
    
    /**
     * 실종 사건 상세 조회
     */
    public MissingCaseListResponse getMissingCaseDetail(Long id) {
        // 더미데이터 체크
        List<MissingCaseListResponse> dummyData = getDummyData();
        for (MissingCaseListResponse dummy : dummyData) {
            if (dummy.getId().equals(id)) {
                return dummy;
            }
        }

        // DB에서 조회
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
     * MissingCase 엔티티를 MissingCaseListResponse DTO로 변환
     */
    private MissingCaseListResponse convertToListResponse(MissingCase missingCase) {
        // S3 URI인 경우에만 HTTP URL로 변환, 기존 Safe182 URL은 그대로 유지
        String convertedFileUrl = s3UrlConverter.convertS3UriToHttpUrl(missingCase.getFileUrl());

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
                .fileUrl(convertedFileUrl)
                .msspsnIdntfccd(missingCase.getMsspsnIdntfccd())
                .etcSpfeatr(missingCase.getEtcSpfeatr())
                .occurLat(missingCase.getOccurLat())
                .occurLon(missingCase.getOccurLon())
                .geocodeProvider(missingCase.getGeocodeProvider())
                .geocodedAt(missingCase.getGeocodedAt())
                .caseStatus(missingCase.getCaseStatus())
                .endedAt(missingCase.getEndedAt())
                .lastCheckedAt(missingCase.getLastCheckedAt())
                .sourceUpdatedAt(missingCase.getSourceUpdatedAt())
                .createdAt(missingCase.getCreatedAt())
                .updatedAt(missingCase.getUpdatedAt())
                .aiImageUrl(missingCase.getAiImageUrl())
                .build();
    }

    /**
     * 더미 데이터 생성
     */
    private List<MissingCaseListResponse> getDummyData() {
        List<MissingCaseListResponse> dummyList = new ArrayList<>();

        // 이민준
        dummyList.add(MissingCaseListResponse.builder()
                .id(1000L)
                .occrde("20250926")
                .nm("이민준")
                .sexdstnDscd("남자")
                .age((short) 26)
                .ageNow((short) 26)
                .wrtngTrgetDscd("020")
                .occrAdres("서울특별시 강남구 영동대로 513")
                .alldressingDscd("캐주얼차림")
                .height((short) 175)
                .bdwgh((short) 70)
                .frmDscd("건강한")
                .faceshpeDscd("계란형")
                .hairshpeDscd("짧은머리")
                .haircolrDscd("흑색")
                .etcSpfeatr("뿔테안경 착용")
                .tknphotolength(23580)
                .fileUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/inputs/missing-person-1/nofacewithstyle%20(3).jpg")
                .msspsnIdntfccd(5800123L)
                .caseStatus(CaseStatus.OPEN)
                .lastCheckedAt(LocalDateTime.of(2025, 9, 26, 9, 15, 30, 123456000))
                .sourceUpdatedAt(LocalDateTime.of(2025, 9, 26, 9, 15, 30, 123452000))
                .createdAt(LocalDateTime.of(2025, 9, 26, 16, 30, 15, 234567000))
                .updatedAt(LocalDateTime.of(2025, 9, 26, 9, 15, 30, 125789000))
                .aiImageUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EC%9D%B4%EB%AF%BC%EC%A4%80.png")
                .speedKmh(4.8) // 26세 남성, 건강한 체격
                .build());

        // 변정효
        dummyList.add(MissingCaseListResponse.builder()
                .id(1001L)
                .occrde("20250926")
                .nm("변정효")
                .sexdstnDscd("남자")
                .age((short) 26)
                .ageNow((short) 26)
                .wrtngTrgetDscd("020")
                .occrAdres("서울특별시 강남구 테헤란로 212")
                .alldressingDscd("캐주얼차림")
                .height((short) 190)
                .bdwgh((short) 110)
                .frmDscd("통통한")
                .faceshpeDscd("계란형")
                .hairshpeDscd("짧은머리")
                .haircolrDscd("흑색")
                .etcSpfeatr("뿔테안경 착용")
                .tknphotolength(24120)
                .fileUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/inputs/missing-person-2/nofacewithstyle%20(2).jpg")
                .msspsnIdntfccd(5800124L)
                .caseStatus(CaseStatus.OPEN)
                .lastCheckedAt(LocalDateTime.of(2025, 9, 26, 10, 22, 15, 234567000))
                .sourceUpdatedAt(LocalDateTime.of(2025, 9, 26, 10, 22, 15, 234563000))
                .createdAt(LocalDateTime.of(2025, 9, 26, 14, 45, 30, 345678000))
                .updatedAt(LocalDateTime.of(2025, 9, 26, 10, 22, 15, 236890000))
                .aiImageUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EB%B3%80%EC%A0%95%ED%9A%A8.png")
                .speedKmh(4.2) // 26세 남성, 통통한 체격
                .build());

        // 민지소
        dummyList.add(MissingCaseListResponse.builder()
                .id(1002L)
                .occrde("20250926")
                .nm("민지소")
                .sexdstnDscd("남자")
                .age((short) 26)
                .ageNow((short) 26)
                .wrtngTrgetDscd("020")
                .occrAdres("경기도 수원시 세류로 60")
                .alldressingDscd("캐주얼차림")
                .height((short) 160)
                .bdwgh((short) 50)
                .frmDscd("왜소한")
                .faceshpeDscd("계란형")
                .hairshpeDscd("짧은머리")
                .haircolrDscd("흑색")
                .etcSpfeatr("뿔테안경 착용")
                .tknphotolength(22890)
                .fileUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/inputs/missing-person-3/lowface%20(3).jpg")
                .msspsnIdntfccd(5800125L)
                .caseStatus(CaseStatus.OPEN)
                .lastCheckedAt(LocalDateTime.of(2025, 9, 26, 11, 35, 42, 456789000))
                .sourceUpdatedAt(LocalDateTime.of(2025, 9, 26, 11, 35, 42, 456785000))
                .createdAt(LocalDateTime.of(2025, 9, 26, 13, 20, 45, 567890000))
                .updatedAt(LocalDateTime.of(2025, 9, 26, 11, 35, 42, 459012000))
                .aiImageUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EB%AF%BC%EC%A7%80%EC%86%8C.png")
                .speedKmh(4.0) // 26세 남성, 왜소한 체격
                .build());

        // 류영재
        dummyList.add(MissingCaseListResponse.builder()
                .id(1003L)
                .occrde("19850315")
                .nm("류영재")
                .sexdstnDscd("남자")
                .age((short) 26)
                .ageNow((short) 66)
                .wrtngTrgetDscd("020")
                .occrAdres("서울특별시 종로구 인사동길 12")
                .alldressingDscd("정장차림")
                .height((short) 172)
                .bdwgh((short) 68)
                .frmDscd("보통")
                .faceshpeDscd("계란형")
                .hairshpeDscd("짧은머리")
                .haircolrDscd("흑색")
                .etcSpfeatr("뿔테안경 착용")
                .tknphotolength(28340)
                .fileUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/inputs/missing-person-2/face_main.jpg")
                .msspsnIdntfccd(5800126L)
                .caseStatus(CaseStatus.OPEN)
                .lastCheckedAt(LocalDateTime.of(2025, 9, 26, 8, 45, 12, 789123000))
                .sourceUpdatedAt(LocalDateTime.of(2025, 9, 26, 8, 45, 12, 789119000))
                .createdAt(LocalDateTime.of(1985, 3, 16, 9, 30, 0, 123456000))
                .updatedAt(LocalDateTime.of(2025, 9, 26, 8, 45, 12, 791456000))
                .aiImageUrl("https://seoul-ht-06-dasibom.s3.us-west-1.amazonaws.com/ai_image/%EB%A5%98%EC%98%81%EC%9E%AC.png")
                .speedKmh(3.2) // 66세 남성, 보통 체격
                .build());

        return dummyList;
    }
}