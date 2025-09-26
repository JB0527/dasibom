package site.dasibom.domain.missingcase.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCaseRequest(
    @NotBlank String name,
    @NotBlank String address,
    Double occurLat,
    Double occurLon
) {}