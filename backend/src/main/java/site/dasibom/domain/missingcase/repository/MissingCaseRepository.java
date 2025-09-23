package site.dasibom.domain.missingcase.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import site.dasibom.domain.missingcase.entity.MissingCase;

public interface MissingCaseRepository extends JpaRepository<MissingCase, Long> { 
}