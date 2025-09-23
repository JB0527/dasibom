package site.dasibom.domain.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import site.dasibom.domain.auth.entity.User;
import site.dasibom.domain.auth.service.AuthService;
import site.dasibom.domain.common.enums.ProviderType;
import site.dasibom.global.common.ApiResponse;

@RestController 
@RequestMapping("/api/auth") 
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    
    @PostMapping("/signup")
    public ApiResponse<User> signup(@RequestParam String phone, @RequestParam String name) {
        return ApiResponse.ok(auth.getOrCreate(phone, name, ProviderType.PASS, phone));
    }
}