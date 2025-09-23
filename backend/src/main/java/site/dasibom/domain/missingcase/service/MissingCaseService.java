package site.dasibom.domain.missingcase.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.missingcase.dto.CaseResponse;
import site.dasibom.domain.missingcase.dto.CreateCaseRequest;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import java.util.List;

@Service 
@RequiredArgsConstructor 
@Transactional(readOnly = true)
public class MissingCaseService {
    private final MissingCaseRepository repo;

    @Transactional
    public CaseResponse create(CreateCaseRequest req) {
        MissingCase mc = new MissingCase();
        mc.setNm(req.name()); 
        mc.setOccrAdres(req.address());
        mc.setOccurLat(req.occurLat()); 
        mc.setOccurLon(req.occurLon());
        return CaseResponse.from(repo.save(mc));
    }
    
    public CaseResponse get(Long id) { 
        return CaseResponse.from(repo.findById(id).orElseThrow()); 
    }
    
    public List<CaseResponse> list() { 
        return repo.findAll().stream().map(CaseResponse::from).toList(); 
    }
}