package site.dasibom.domain.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import site.dasibom.global.common.BaseEntity;
import site.dasibom.domain.common.enums.RoleType;
import site.dasibom.domain.common.enums.ProviderType;

@Getter 
@Setter 
@NoArgsConstructor
@Entity 
@Table(name="users", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_user_id"}))
public class User extends BaseEntity {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 10)
    private String phone;

    @Column(nullable = false, length = 10)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role = RoleType.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProviderType provider = ProviderType.PASS;

    @Column(name = "provider_user_id", nullable = false, length = 191)
    private String providerUserId;
}