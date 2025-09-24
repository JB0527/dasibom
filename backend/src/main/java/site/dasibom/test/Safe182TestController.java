package site.dasibom.test;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/test")
public class Safe182TestController {
    
    @GetMapping("/hello")
    public ResponseEntity<?> hello() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Hello from Dasibom API!",
            "timestamp", System.currentTimeMillis()
        ));
    }
    
    @GetMapping("/safe182/manual")
    public ResponseEntity<?> testSafe182Manual() {
        log.info("Safe182 수동 테스트 요청");
        
        try {
            // 직접 HTTP 요청으로 Safe182 API 테스트
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            
            String formData = "esntlId=10000838&authKey=bca2e2d148a24ced&rowSize=1";
            
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://www.safe182.go.kr/api/lcm/amberList.do"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(formData))
                .build();
            
            java.net.http.HttpResponse<String> response = client.send(request, 
                java.net.http.HttpResponse.BodyHandlers.ofString());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "statusCode", response.statusCode(),
                "responseBody", response.body(),
                "message", "Safe182 API 직접 호출 완료"
            ));
            
        } catch (Exception e) {
            log.error("Safe182 API 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/safe182/findchild/manual")
    public ResponseEntity<?> testSafe182FindChildManual() {
        log.info("Safe182 FindChild 수동 테스트 요청");
        
        try {
            // 직접 HTTP 요청으로 Safe182 FindChildList API 테스트
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            
            String formData = "esntlId=10000838&authKey=bca2e2d148a24ced&rowSize=5";
            
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("https://www.safe182.go.kr/api/lcm/findChildList.do"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(formData))
                .build();
            
            java.net.http.HttpResponse<String> response = client.send(request, 
                java.net.http.HttpResponse.BodyHandlers.ofString());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "statusCode", response.statusCode(),
                "responseBody", response.body(),
                "message", "Safe182 FindChildList API 직접 호출 완료",
                "apiUrl", "https://www.safe182.go.kr/api/lcm/findChildList.do"
            ));
            
        } catch (Exception e) {
            log.error("Safe182 FindChildList API 테스트 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}