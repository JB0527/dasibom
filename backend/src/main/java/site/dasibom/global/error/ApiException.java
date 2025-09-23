package site.dasibom.global.error;

public class ApiException extends RuntimeException {
    private final ErrorCode code;
    
    public ApiException(ErrorCode code) { 
        super(code.message); 
        this.code = code; 
    }
    
    public ErrorCode getCode() { 
        return code; 
    }
}