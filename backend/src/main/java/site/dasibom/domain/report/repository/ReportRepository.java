package site.dasibom.domain.report.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import site.dasibom.domain.report.entity.Report;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    
    List<Report> findByMissingCaseIdOrderByReportedAtDesc(Long caseId);
    
}