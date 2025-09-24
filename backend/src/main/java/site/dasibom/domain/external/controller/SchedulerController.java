package site.dasibom.domain.external.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import site.dasibom.domain.external.service.Safe182Service;
import site.dasibom.domain.missingcase.entity.MissingCase;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/scheduler")
@RequiredArgsConstructor
@ConditionalOnProperty(
    value = "external.safe182.scheduler.enabled", 
    havingValue = "true"
)
public class SchedulerController {
    
    private final Safe182Service safe182Service;
    
    @Value("${external.safe182.scheduler.fixed-rate:300000}")
    private long fixedRate;
    
    @Value("${external.safe182.scheduler.initial-delay:60000}")
    private long initialDelay;
    
    /**
     * 수동으로 Safe182 동기화 실행
     */
    @PostMapping("/safe182/sync-now")
    public ResponseEntity<?> triggerSync() {
        try {
            log.info("수동 Safe182 동기화 요청 시작");
            
            List<MissingCase> syncedCases = safe182Service.syncMissingPersonsFromSafe182();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "syncedCount", syncedCases.size(),
                    "syncTime", LocalDateTime.now(),
                    "message", "수동 동기화가 완료되었습니다."
                )
            ));
            
        } catch (Exception e) {
            log.error("수동 Safe182 동기화 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "수동 동기화 실패: " + e.getMessage(),
                "syncTime", LocalDateTime.now()
            ));
        }
    }
    
    /**
     * 스케줄러 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<?> getSchedulerStatus() {
        long intervalMinutes = fixedRate / 60000; // ms를 분으로 변환
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "schedulerEnabled", true,
                "syncInterval", intervalMinutes + "분마다",
                "nextSyncInfo", String.format("스케줄러가 자동으로 %d분마다 실행됩니다.", intervalMinutes),
                "currentTime", LocalDateTime.now()
            )
        ));
    }
    
    /**
     * 스케줄러 설정 정보
     */
    @GetMapping("/config")
    public ResponseEntity<?> getSchedulerConfig() {
        long intervalMinutes = fixedRate / 60000; // ms를 분으로 변환
        long intervalSeconds = fixedRate / 1000;  // ms를 초로 변환
        long delayMinutes = initialDelay / 60000; // ms를 분으로 변환
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "interval", String.format("%d분 (%d초)", intervalMinutes, intervalSeconds),
                "fixedRate", fixedRate + "ms",
                "initialDelay", initialDelay + "ms (" + delayMinutes + "분)",
                "description", String.format("fixedRate를 사용하여 이전 실행 완료와 관계없이 정확히 %d분마다 실행", intervalMinutes),
                "alternativeOptions", Map.of(
                    "fixedDelay", String.format("이전 실행 완료 후 %d분 대기", intervalMinutes),
                    "cron", String.format("크론 표현식 사용 가능 (예: 0 */%d * * * *)", intervalMinutes)
                )
            )
        ));
    }
}