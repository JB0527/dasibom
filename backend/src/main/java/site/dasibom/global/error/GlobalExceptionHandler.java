package site.dasibom.global.error;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import site.dasibom.global.common.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Object>> handleApi(ApiException e) {
        return ResponseEntity.status(e.getCode().status).body(ApiResponse.error(e.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValid(MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error("Validation failed"));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleEtc(Exception e) {
        e.printStackTrace();
        System.err.println("Exception caught: " + e.getMessage());
        System.err.println("Exception type: " + e.getClass().getName());
        return ResponseEntity.internalServerError().body(ApiResponse.error("Unexpected error: " + e.getMessage()));
    }
}