package site.dasibom.domain.report.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.report.dto.CreateReportRequest;
import site.dasibom.domain.report.dto.ReportResponse;
import site.dasibom.domain.report.entity.Report;
import site.dasibom.domain.report.repository.ReportRepository;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.missingcase.entity.MissingCase;
import java.util.List;

@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class ReportService {
    private final ReportRepository repo;
    private final MissingCaseRepository missingCaseRepository;
    
    @Transactional 
    public ReportResponse create(CreateReportRequest req) { 
        Report r = new Report(); 
        MissingCase missingCase = missingCaseRepository.findById(req.caseId())
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        r.setMissingCase(missingCase); 
        r.setDescription(req.description()); 
        return ReportResponse.from(repo.save(r)); 
    }
    
    public ReportResponse get(Long id) { 
        return ReportResponse.from(repo.findById(id).orElseThrow()); 
    }
    
    public List<ReportResponse> list() { 
        return repo.findAll().stream().map(ReportResponse::from).toList(); 
    }
}