package site.dasibom.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import site.dasibom.domain.auth.entity.User;
import site.dasibom.domain.auth.repository.UserRepository;
import site.dasibom.domain.common.enums.ProviderType;

@Service 
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    
    public User getOrCreate(String phone, String name, ProviderType provider, String providerUserId) {
        return users.findByProviderAndProviderUserId(provider, providerUserId)
            .orElseGet(() -> {
                User u = new User(); 
                u.setPhone(phone); 
                u.setName(name);
                u.setProvider(provider);
                u.setProviderUserId(providerUserId);
                return users.save(u);
            });
    }
}