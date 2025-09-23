package site.dasibom.domain.auth.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import site.dasibom.domain.auth.entity.User;
import site.dasibom.domain.common.enums.ProviderType;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByProviderAndProviderUserId(ProviderType provider, String providerUserId);
}