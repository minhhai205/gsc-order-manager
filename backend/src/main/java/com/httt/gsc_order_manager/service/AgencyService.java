package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.dto.agency.CreateAgencyRequest;
import com.httt.gsc_order_manager.dto.agency.UpdateAgencyRequest;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.mapper.AgencyMapper;
import com.httt.gsc_order_manager.repository.FederalAgencyRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AgencyService {

    private final FederalAgencyRepository federalAgencyRepository;
    private final AuditLogService auditLogService;

    public AgencyService(FederalAgencyRepository federalAgencyRepository, AuditLogService auditLogService) {
        this.federalAgencyRepository = federalAgencyRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AgencyResponse> findAll(
        String keyword,
        String agencyCode,
        String name,
        Pageable pageable
    ) {
        Page<AgencyResponse> agencies = federalAgencyRepository
            .findAll(buildSpecification(keyword, agencyCode, name), pageable)
            .map(AgencyMapper::toResponse);
        return PagedResponse.<AgencyResponse>builder()
            .content(agencies.getContent())
            .page(agencies.getNumber())
            .size(agencies.getSize())
            .totalElements(agencies.getTotalElements())
            .totalPages(agencies.getTotalPages())
            .build();
    }

    @Transactional
    public AgencyResponse create(CreateAgencyRequest request) {
        if (federalAgencyRepository.existsByAgencyCodeIgnoreCase(request.getAgencyCode())) {
            throw new IllegalArgumentException("Agency code already exists");
        }

        FederalAgency agency = federalAgencyRepository.save(AgencyMapper.toEntity(request));
        auditLogService.record(
            AuditAction.CREATE,
            FederalAgency.class.getSimpleName(),
            agency.getId(),
            "Created agency " + agency.getAgencyCode()
        );
        return AgencyMapper.toResponse(agency);
    }

    @Transactional(readOnly = true)
    public AgencyResponse getById(Long id) {
        return AgencyMapper.toResponse(findAgency(id));
    }

    @Transactional
    public AgencyResponse update(Long id, UpdateAgencyRequest request) {
        FederalAgency agency = findAgency(id);
        federalAgencyRepository.findByAgencyCodeIgnoreCase(request.getAgencyCode())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new IllegalArgumentException("Agency code already exists");
            });

        AgencyMapper.updateEntity(agency, request);
        auditLogService.record(
            AuditAction.UPDATE,
            FederalAgency.class.getSimpleName(),
            agency.getId(),
            "Updated agency " + agency.getAgencyCode()
        );
        return AgencyMapper.toResponse(agency);
    }

    @Transactional
    public AgencyResponse disable(Long id) {
        FederalAgency agency = findAgency(id);
        agency.setActive(false);
        auditLogService.record(
            AuditAction.DISABLE,
            FederalAgency.class.getSimpleName(),
            agency.getId(),
            "Disabled agency " + agency.getAgencyCode()
        );
        return AgencyMapper.toResponse(agency);
    }

    @Transactional
    public AgencyResponse enable(Long id) {
        FederalAgency agency = findAgency(id);
        agency.setActive(true);
        auditLogService.record(
            AuditAction.UPDATE,
            FederalAgency.class.getSimpleName(),
            agency.getId(),
            "Enabled agency " + agency.getAgencyCode()
        );
        return AgencyMapper.toResponse(agency);
    }

    private FederalAgency findAgency(Long id) {
        return federalAgencyRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Agency not found"));
    }

    private Specification<FederalAgency> buildSpecification(String keyword, String agencyCode, String name) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("agencyCode")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("contactName")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("contactEmail")), value)
                ));
            }
            if (StringUtils.hasText(agencyCode)) {
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("agencyCode")),
                    agencyCode.trim().toLowerCase()
                ));
            }
            if (StringUtils.hasText(name)) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("name")),
                    "%" + name.trim().toLowerCase() + "%"
                ));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
