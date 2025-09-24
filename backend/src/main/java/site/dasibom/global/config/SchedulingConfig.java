package site.dasibom.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // @EnableScheduling 어노테이션으로 스케줄링 기능 활성화
    // 추가 설정이 필요하면 여기에 Bean으로 등록
}