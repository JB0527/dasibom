package site.dasibom.domain.report.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import site.dasibom.domain.report.entity.Report;

public interface ReportRepository extends JpaRepository<Report, Long> { 
}