package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.dto.agency.CreateAgencyRequest;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.mapper.AgencyMapper;
import com.httt.gsc_order_manager.repository.FederalAgencyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgencyService {

    private final FederalAgencyRepository federalAgencyRepository;
    private final AuditLogService auditLogService;

    public AgencyService(FederalAgencyRepository federalAgencyRepository, AuditLogService auditLogService) {
        this.federalAgencyRepository = federalAgencyRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public AgencyResponse create(CreateAgencyRequest request) {
        if (federalAgencyRepository.existsByAgencyCode(request.getAgencyCode())) {
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
}
