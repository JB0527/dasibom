package site.dasibom.domain.missingcase.dto;

import site.dasibom.domain.missingcase.entity.MissingCase;

public record CaseResponse(Long id, String name, String address, Double occurLat, Double occurLon) {
    public static CaseResponse from(MissingCase e) {
        return new CaseResponse(e.getId(), e.getNm(), e.getOccrAdres(), e.getOccurLat(), e.getOccurLon());
    }
}