package site.dasibom.global.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    NOT_FOUND(HttpStatus.NOT_FOUND, "Not Found"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Bad Request"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Error");
    
    public final HttpStatus status; 
    public final String message;
    
    ErrorCode(HttpStatus s, String m) { 
        this.status = s; 
        this.message = m; 
    }
}