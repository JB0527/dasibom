package site.dasibom.domain.missingcase.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import site.dasibom.domain.missingcase.dto.CaseResponse;
import site.dasibom.domain.missingcase.dto.CreateCaseRequest;
import site.dasibom.domain.missingcase.entity.MissingCase;
import site.dasibom.domain.missingcase.repository.MissingCaseRepository;
import site.dasibom.domain.missingcase.controller.MissingCaseController.ContactRequest;
import site.dasibom.domain.missingcase.controller.MissingCaseController.PredictionRequest;
import site.dasibom.domain.missingcase.controller.MissingCaseController.PredictionResponse;
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
    
    // 실종 사건 수정 - TODO: 엔티티 필드별 수정 로직 구현 필요
    @Transactional
    public CaseResponse update(Long id, CreateCaseRequest req) {
        MissingCase mc = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        
        mc.setNm(req.name());
        mc.setOccrAdres(req.address());
        mc.setOccurLat(req.occurLat());
        mc.setOccurLon(req.occurLon());
        
        return CaseResponse.from(repo.save(mc));
    }
    
    // 실종 사건 삭제 - TODO: 관련 Report 엔티티 처리 고려 (CASCADE 설정 확인)
    @Transactional
    public void delete(Long id) {
        MissingCase mc = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        repo.delete(mc);
    }
    
    // 연락처 등록 - TODO: CaseContact 엔티티 구현 및 연동 필요
    @Transactional
    public void addContact(Long caseId, ContactRequest req) {
        MissingCase mc = repo.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        
        // TODO: CaseContact 엔티티 생성 및 저장
        // CaseContact contact = new CaseContact();
        // contact.setMissingCase(mc);
        // contact.setName(req.name());
        // contact.setPhone(req.phone());
        // contact.setRelationship(req.relationship());
        // caseContactRepository.save(contact);
        
        throw new UnsupportedOperationException("CaseContact 엔티티 구현 필요");
    }
    
    // 이동 예측 조회 - TODO: AI 모델 연동 및 MovementPrediction 엔티티 조회
    public PredictionResponse getPrediction(Long caseId) {
        MissingCase mc = repo.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        
        // TODO: MovementPrediction 엔티티에서 최신 예측 조회
        // 또는 AI 모델 API 호출하여 실시간 예측 생성
        
        // 임시 더미 데이터 반환
        return new PredictionResponse(37.5665, 126.9780, 0.75, "24hours");
    }
    
    // 예측 저장 - TODO: MovementPrediction 엔티티 구현 및 저장
    @Transactional
    public void savePrediction(Long caseId, PredictionRequest req) {
        MissingCase mc = repo.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("MissingCase not found"));
        
        // TODO: MovementPrediction 엔티티 생성 및 저장
        // MovementPrediction prediction = new MovementPrediction();
        // prediction.setMissingCase(mc);
        // prediction.setPredictedLat(req.lat());
        // prediction.setPredictedLon(req.lon());
        // prediction.setConfidence(req.confidence());
        // prediction.setTimeframe(req.timeframe());
        // movementPredictionRepository.save(prediction);
        
        throw new UnsupportedOperationException("MovementPrediction 엔티티 구현 필요");
    }
}