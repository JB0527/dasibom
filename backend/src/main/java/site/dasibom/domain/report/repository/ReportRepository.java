package site.dasibom.domain.report.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import site.dasibom.domain.report.entity.Report;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByMissingCaseIdOrderByReportedAtDesc(Long caseId);

    @Modifying
    @Query(value = """
        INSERT INTO report (case_id, reported_at, sighted_at, location, certainty, description, attachment_url, created_at, updated_at)
        VALUES (:caseId, :reportedAt, :sightedAt, :location, :certainty, :description, :attachmentUrl, :createdAt, :updatedAt)
        """, nativeQuery = true)
    void insertReportForDummyCase(
        @Param("caseId") Long caseId,
        @Param("reportedAt") LocalDateTime reportedAt,
        @Param("sightedAt") LocalDateTime sightedAt,
        @Param("location") String location,
        @Param("certainty") String certainty,
        @Param("description") String description,
        @Param("attachmentUrl") String attachmentUrl,
        @Param("createdAt") LocalDateTime createdAt,
        @Param("updatedAt") LocalDateTime updatedAt
    );

}