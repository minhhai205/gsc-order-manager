package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.contract.CreateStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.mapper.StandingContractMapper;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import com.httt.gsc_order_manager.repository.FederalAgencyRepository;
import com.httt.gsc_order_manager.repository.StandingContractRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StandingContractService {

    private final StandingContractRepository standingContractRepository;
    private final FederalAgencyRepository federalAgencyRepository;
    private final EquipmentRepository equipmentRepository;
    private final AuditLogService auditLogService;

    public StandingContractService(
        StandingContractRepository standingContractRepository,
        FederalAgencyRepository federalAgencyRepository,
        EquipmentRepository equipmentRepository,
        AuditLogService auditLogService
    ) {
        this.standingContractRepository = standingContractRepository;
        this.federalAgencyRepository = federalAgencyRepository;
        this.equipmentRepository = equipmentRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public StandingContractResponse create(CreateStandingContractRequest request) {
        validateDateRange(request);
        if (standingContractRepository.existsByContractNumber(request.getContractNumber())) {
            throw new IllegalArgumentException("Contract number already exists");
        }

        FederalAgency agency = federalAgencyRepository.findById(request.getAgencyId())
            .orElseThrow(() -> new IllegalArgumentException("Agency not found"));
        if (!agency.isActive()) {
            throw new IllegalArgumentException("Agency is disabled");
        }

        Set<Equipment> allowedEquipment = loadAllowedEquipment(request.getAllowedEquipmentIds());

        StandingContract contract = new StandingContract();
        contract.setContractNumber(request.getContractNumber());
        contract.setAgency(agency);
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setCostLimit(request.getCostLimit());
        contract.setStatus(ContractStatus.VALID);
        contract.setAllowedEquipment(allowedEquipment);

        StandingContract savedContract = standingContractRepository.save(contract);
        auditLogService.record(
            AuditAction.CREATE,
            StandingContract.class.getSimpleName(),
            savedContract.getId(),
            "Created standing contract " + savedContract.getContractNumber()
        );
        return StandingContractMapper.toResponse(savedContract);
    }

    private void validateDateRange(CreateStandingContractRequest request) {
        if (request.getStartDate() != null
            && request.getEndDate() != null
            && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Contract end date must be on or after start date");
        }
    }

    private Set<Equipment> loadAllowedEquipment(List<Long> equipmentIds) {
        Set<Long> uniqueIds = new LinkedHashSet<>(equipmentIds);
        List<Equipment> equipment = equipmentRepository.findAllById(uniqueIds);
        if (equipment.size() != uniqueIds.size()) {
            throw new IllegalArgumentException("One or more equipment items were not found");
        }
        if (equipment.stream().anyMatch(item -> !item.isActive())) {
            throw new IllegalArgumentException("Allowed equipment cannot include disabled equipment");
        }
        return new LinkedHashSet<>(equipment);
    }
}
