package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.contract.CreateStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.ExtendStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.dto.contract.UpdateAllowedEquipmentRequest;
import com.httt.gsc_order_manager.dto.contract.UpdateStandingContractRequest;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.FederalAgency;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.mapper.EquipmentMapper;
import com.httt.gsc_order_manager.mapper.StandingContractMapper;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import com.httt.gsc_order_manager.repository.FederalAgencyRepository;
import com.httt.gsc_order_manager.repository.StandingContractRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

    @Transactional(readOnly = true)
    public PagedResponse<StandingContractResponse> findAll(
        String keyword,
        String contractNumber,
        Long agencyId,
        ContractStatus status,
        Pageable pageable
    ) {
        Page<StandingContractResponse> contracts = standingContractRepository
            .findAll(buildSpecification(keyword, contractNumber, agencyId, status), pageable)
            .map(StandingContractMapper::toResponse);
        return PagedResponse.<StandingContractResponse>builder()
            .content(contracts.getContent())
            .page(contracts.getNumber())
            .size(contracts.getSize())
            .totalElements(contracts.getTotalElements())
            .totalPages(contracts.getTotalPages())
            .build();
    }

    @Transactional
    public StandingContractResponse create(CreateStandingContractRequest request) {
        validateDateRange(request);
        if (standingContractRepository.existsByContractNumberIgnoreCase(request.getContractNumber())) {
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

    @Transactional(readOnly = true)
    public StandingContractResponse getById(Long id) {
        return StandingContractMapper.toResponse(findContract(id));
    }

    @Transactional
    public StandingContractResponse update(Long id, UpdateStandingContractRequest request) {
        validateDateRange(request.getStartDate(), request.getEndDate());
        StandingContract contract = findContract(id);
        if (StringUtils.hasText(request.getContractNumber())) {
            standingContractRepository.findByContractNumberIgnoreCase(request.getContractNumber())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Contract number already exists");
                });
            contract.setContractNumber(request.getContractNumber());
        }

        FederalAgency agency = findActiveAgency(request.getAgencyId());
        contract.setAgency(agency);
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setCostLimit(request.getCostLimit());
        contract.setAllowedEquipment(loadAllowedEquipment(request.getAllowedEquipmentIds()));
        contract.setStatus(resolveActiveStatus(contract.getEndDate()));

        auditLogService.record(
            AuditAction.UPDATE,
            StandingContract.class.getSimpleName(),
            contract.getId(),
            "Updated standing contract " + contract.getContractNumber()
        );
        return StandingContractMapper.toResponse(contract);
    }

    @Transactional
    public StandingContractResponse disable(Long id) {
        StandingContract contract = findContract(id);
        contract.setStatus(ContractStatus.DISABLED);
        auditLogService.record(
            AuditAction.DISABLE,
            StandingContract.class.getSimpleName(),
            contract.getId(),
            "Disabled standing contract " + contract.getContractNumber()
        );
        return StandingContractMapper.toResponse(contract);
    }

    @Transactional
    public StandingContractResponse extend(Long id, ExtendStandingContractRequest request) {
        StandingContract contract = findContract(id);
        if (!request.getNewEndDate().isAfter(contract.getEndDate())) {
            throw new IllegalArgumentException("New end date must be after current end date");
        }
        contract.setEndDate(request.getNewEndDate());
        if (request.getAdditionalCostLimit() != null) {
            contract.setCostLimit(contract.getCostLimit().add(request.getAdditionalCostLimit()));
        }
        contract.setStatus(resolveActiveStatus(contract.getEndDate()));
        auditLogService.record(
            AuditAction.UPDATE,
            StandingContract.class.getSimpleName(),
            contract.getId(),
            "Extended standing contract " + contract.getContractNumber()
        );
        return StandingContractMapper.toResponse(contract);
    }

    @Transactional(readOnly = true)
    public List<EquipmentResponse> getAllowedEquipment(Long id) {
        return findContract(id).getAllowedEquipment()
            .stream()
            .map(EquipmentMapper::toResponse)
            .toList();
    }

    @Transactional
    public StandingContractResponse updateAllowedEquipment(Long id, UpdateAllowedEquipmentRequest request) {
        StandingContract contract = findContract(id);
        contract.setAllowedEquipment(loadAllowedEquipment(request.getAllowedEquipmentIds()));
        auditLogService.record(
            AuditAction.UPDATE,
            StandingContract.class.getSimpleName(),
            contract.getId(),
            "Updated allowed equipment for standing contract " + contract.getContractNumber()
        );
        return StandingContractMapper.toResponse(contract);
    }

    @Transactional(readOnly = true)
    public List<StandingContractResponse> findExpiringSoon() {
        LocalDate today = LocalDate.now();
        return standingContractRepository
            .findByEndDateBetweenAndStatusNot(today, today.plusDays(30), ContractStatus.DISABLED)
            .stream()
            .map(StandingContractMapper::toResponse)
            .toList();
    }

    private void validateDateRange(CreateStandingContractRequest request) {
        validateDateRange(request.getStartDate(), request.getEndDate());
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Contract end date must be on or after start date");
        }
    }

    private FederalAgency findActiveAgency(Long agencyId) {
        FederalAgency agency = federalAgencyRepository.findById(agencyId)
            .orElseThrow(() -> new IllegalArgumentException("Agency not found"));
        if (!agency.isActive()) {
            throw new IllegalArgumentException("Agency is disabled");
        }
        return agency;
    }

    private StandingContract findContract(Long id) {
        return standingContractRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Standing contract not found"));
    }

    private ContractStatus resolveActiveStatus(LocalDate endDate) {
        LocalDate today = LocalDate.now();
        if (endDate.isBefore(today)) {
            return ContractStatus.EXPIRED;
        }
        if (!endDate.isAfter(today.plusDays(30))) {
            return ContractStatus.EXPIRING_SOON;
        }
        return ContractStatus.VALID;
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

    private Specification<StandingContract> buildSpecification(
        String keyword,
        String contractNumber,
        Long agencyId,
        ContractStatus status
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("contractNumber")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("agency").get("agencyCode")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("agency").get("name")), value)
                ));
            }
            if (StringUtils.hasText(contractNumber)) {
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("contractNumber")),
                    contractNumber.trim().toLowerCase()
                ));
            }
            if (agencyId != null) {
                predicates.add(criteriaBuilder.equal(root.get("agency").get("id"), agencyId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
