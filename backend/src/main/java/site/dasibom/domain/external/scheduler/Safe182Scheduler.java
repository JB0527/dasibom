package site.dasibom.domain.external.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import site.dasibom.domain.external.service.Safe182Service;
import site.dasibom.domain.missingcase.entity.MissingCase;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    value = "external.safe182.scheduler.enabled", 
    havingValue = "true", 
    matchIfMissing = false
)
public class Safe182Scheduler {
    
    private final Safe182Service safe182Service;
    
    /**
     * Safe182 API 정기 동기화 스케줄러
     * 설정파일에서 지정한 간격으로 실행
     */
    @Scheduled(fixedRateString = "${external.safe182.scheduler.fixed-rate:300000}")
    public void syncSafe182Data() {
        try {
            log.info("=== Safe182 정기 동기화 시작 ===");
            
            // 실종자 데이터 동기화
            List<MissingCase> missingPersons = safe182Service.syncMissingPersonsFromSafe182();
            
            // 실종아동 데이터 동기화
            List<MissingCase> missingChildren = safe182Service.syncMissingChildrenFromSafe182();
            
            int totalProcessed = missingPersons.size() + missingChildren.size();
            log.info("=== Safe182 정기 동기화 완료 - 실종자: {}건, 실종아동: {}건, 총: {}건 ===", 
                    missingPersons.size(), missingChildren.size(), totalProcessed);
            
        } catch (Exception e) {
            log.error("Safe182 정기 동기화 중 오류 발생", e);
            
            // 여기에 알림 서비스나 모니터링 연동 가능
            // 예: Slack, Discord, 이메일 알림 등
        }
    }
    
    /**
     * 애플리케이션 시작 후 지정된 시간 뒤에 첫 동기화 실행
     * 이후 설정된 간격으로 실행 (initialDelay와 fixedRate 모두 설정파일에서 관리)
     */
    @Scheduled(
        initialDelayString = "${external.safe182.scheduler.initial-delay:60000}",
        fixedRateString = "${external.safe182.scheduler.fixed-rate:300000}"
    )
    public void syncSafe182DataWithInitialDelay() {
        // 위의 syncSafe182Data()와 동일하지만 시작 지연 있음
        // 둘 중 하나만 사용하려면 주석 처리
        
        // syncSafe182Data(); // 같은 로직이므로 재사용
    }
    
    /**
     * 크론 표현식 사용 예시 (주석 처리)
     * 매 5분마다: 0 slash5 * * * *
     * 매일 오전 9시: 0 0 9 * * *  
     * 매시 정각: 0 0 * * * *
     */
    // @Scheduled(cron = "0 */5 * * * *") // 매 5분마다
    // public void syncSafe182DataByCron() {
    //     syncSafe182Data();
    // }
}