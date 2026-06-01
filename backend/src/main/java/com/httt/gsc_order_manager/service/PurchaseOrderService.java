package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.CreatePurchaseOrderRequest;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderItemRequest;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.UpdatePurchaseOrderRequest;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.mapper.PurchaseOrderMapper;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.StandingContractRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StandingContractRepository standingContractRepository;
    private final EquipmentRepository equipmentRepository;
    private final AuditLogService auditLogService;
    private final RejectionLetterService rejectionLetterService;

    public PurchaseOrderService(
        PurchaseOrderRepository purchaseOrderRepository,
        StandingContractRepository standingContractRepository,
        EquipmentRepository equipmentRepository,
        AuditLogService auditLogService,
        RejectionLetterService rejectionLetterService
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.standingContractRepository = standingContractRepository;
        this.equipmentRepository = equipmentRepository;
        this.auditLogService = auditLogService;
        this.rejectionLetterService = rejectionLetterService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<PurchaseOrderResponse> findAll(
        String keyword,
        String poNumber,
        Long contractId,
        PurchaseOrderStatus status,
        Pageable pageable
    ) {
        Page<PurchaseOrderResponse> purchaseOrders = purchaseOrderRepository
            .findAll(buildSpecification(keyword, poNumber, contractId, status), pageable)
            .map(PurchaseOrderMapper::toResponse);
        return PagedResponse.<PurchaseOrderResponse>builder()
            .content(purchaseOrders.getContent())
            .page(purchaseOrders.getNumber())
            .size(purchaseOrders.getSize())
            .totalElements(purchaseOrders.getTotalElements())
            .totalPages(purchaseOrders.getTotalPages())
            .build();
    }

    @Transactional
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        if (purchaseOrderRepository.existsByPoNumberIgnoreCase(request.getPoNumber())) {
            throw new IllegalArgumentException("Purchase order number already exists");
        }

        StandingContract contract = findContract(request.getContractId());
        PurchaseOrder purchaseOrder = new PurchaseOrder();
        purchaseOrder.setPoNumber(request.getPoNumber());
        purchaseOrder.setContract(contract);
        purchaseOrder.setIssueDate(request.getIssueDate());
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING);
        replaceItems(purchaseOrder, request.getItems());

        PurchaseOrder savedPurchaseOrder = purchaseOrderRepository.save(purchaseOrder);
        auditLogService.record(
            AuditAction.CREATE,
            PurchaseOrder.class.getSimpleName(),
            savedPurchaseOrder.getId(),
            "Created purchase order " + savedPurchaseOrder.getPoNumber()
        );
        return PurchaseOrderMapper.toResponse(savedPurchaseOrder);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(Long id) {
        return PurchaseOrderMapper.toResponse(findPurchaseOrder(id));
    }

    @Transactional
    public PurchaseOrderResponse update(Long id, UpdatePurchaseOrderRequest request) {
        PurchaseOrder purchaseOrder = findPurchaseOrder(id);
        if (purchaseOrder.getStatus() == PurchaseOrderStatus.CLOSED) {
            throw new IllegalArgumentException("Closed purchase order cannot be updated");
        }
        if (StringUtils.hasText(request.getPoNumber())) {
            purchaseOrderRepository.findByPoNumberIgnoreCase(request.getPoNumber())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Purchase order number already exists");
                });
            purchaseOrder.setPoNumber(request.getPoNumber());
        }

        purchaseOrder.setContract(findContract(request.getContractId()));
        purchaseOrder.setIssueDate(request.getIssueDate());
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING);
        purchaseOrder.setValidationReason(null);
        purchaseOrder.setValidatedAt(null);
        replaceItems(purchaseOrder, request.getItems());

        auditLogService.record(
            AuditAction.UPDATE,
            PurchaseOrder.class.getSimpleName(),
            purchaseOrder.getId(),
            "Updated purchase order " + purchaseOrder.getPoNumber()
        );
        return PurchaseOrderMapper.toResponse(purchaseOrder);
    }

    @Transactional
    public PurchaseOrderResponse validate(Long id) {
        PurchaseOrder purchaseOrder = findPurchaseOrder(id);
        List<String> validationErrors = validateAgainstContract(purchaseOrder);
        purchaseOrder.setValidatedAt(Instant.now());
        if (validationErrors.isEmpty()) {
            purchaseOrder.setStatus(PurchaseOrderStatus.OUTSTANDING);
            purchaseOrder.setValidationReason(null);
        } else {
            purchaseOrder.setStatus(PurchaseOrderStatus.INVALID);
            purchaseOrder.setValidationReason(String.join("; ", validationErrors));
            rejectionLetterService.ensureDraftForInvalidPurchaseOrder(purchaseOrder);
        }

        auditLogService.record(
            AuditAction.VALIDATE_PO,
            PurchaseOrder.class.getSimpleName(),
            purchaseOrder.getId(),
            "Validated purchase order " + purchaseOrder.getPoNumber()
        );
        return PurchaseOrderMapper.toResponse(purchaseOrder);
    }

    @Transactional(readOnly = true)
    public PagedResponse<PurchaseOrderResponse> findByStatus(PurchaseOrderStatus status, Pageable pageable) {
        return findAll(null, null, null, status, pageable);
    }

    private void replaceItems(PurchaseOrder purchaseOrder, List<PurchaseOrderItemRequest> itemRequests) {
        Map<Long, Equipment> equipmentById = loadEquipment(itemRequests);
        purchaseOrder.getItems().clear();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemRequest : itemRequests) {
            Equipment equipment = equipmentById.get(itemRequest.getEquipmentId());
            BigDecimal lineTotal = equipment.getUnitPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(purchaseOrder);
            item.setEquipment(equipment);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(equipment.getUnitPrice());
            item.setLineTotal(lineTotal);
            purchaseOrder.getItems().add(item);
            totalAmount = totalAmount.add(lineTotal);
        }
        purchaseOrder.setTotalAmount(totalAmount);
    }

    private Map<Long, Equipment> loadEquipment(List<PurchaseOrderItemRequest> itemRequests) {
        Set<Long> uniqueIds = itemRequests.stream()
            .map(PurchaseOrderItemRequest::getEquipmentId)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        if (uniqueIds.size() != itemRequests.size()) {
            throw new IllegalArgumentException("Purchase order cannot contain duplicate equipment items");
        }
        List<Equipment> equipment = equipmentRepository.findAllById(uniqueIds);
        if (equipment.size() != uniqueIds.size()) {
            throw new IllegalArgumentException("One or more equipment items were not found");
        }
        if (equipment.stream().anyMatch(item -> !item.isActive())) {
            throw new IllegalArgumentException("Purchase order cannot include disabled equipment");
        }
        return equipment.stream().collect(Collectors.toMap(Equipment::getId, Function.identity()));
    }

    private List<String> validateAgainstContract(PurchaseOrder purchaseOrder) {
        StandingContract contract = purchaseOrder.getContract();
        List<String> errors = new ArrayList<>();
        LocalDate today = LocalDate.now();
        if (contract.getStatus() == ContractStatus.DISABLED) {
            errors.add("Contract is disabled");
        }
        if (contract.getStartDate().isAfter(today) || contract.getEndDate().isBefore(today)) {
            errors.add("Contract has expired or is not yet effective");
        }

        Set<Long> allowedEquipmentIds = contract.getAllowedEquipment()
            .stream()
            .map(Equipment::getId)
            .collect(Collectors.toSet());
        List<String> disallowedSkus = purchaseOrder.getItems()
            .stream()
            .map(PurchaseOrderItem::getEquipment)
            .filter(equipment -> !allowedEquipmentIds.contains(equipment.getId()))
            .map(Equipment::getSku)
            .toList();
        if (!disallowedSkus.isEmpty()) {
            errors.add("Equipment is not allowed by contract: " + String.join(", ", disallowedSkus));
        }

        if (purchaseOrder.getTotalAmount().compareTo(contract.getCostLimit()) > 0) {
            errors.add("Total amount exceeds contract cost limit");
        }
        return errors;
    }

    private PurchaseOrder findPurchaseOrder(Long id) {
        return purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
    }

    private StandingContract findContract(Long id) {
        return standingContractRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Standing contract not found"));
    }

    private Specification<PurchaseOrder> buildSpecification(
        String keyword,
        String poNumber,
        Long contractId,
        PurchaseOrderStatus status
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("poNumber")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("contract").get("contractNumber")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("contract").get("agency").get("name")), value)
                ));
            }
            if (StringUtils.hasText(poNumber)) {
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("poNumber")),
                    poNumber.trim().toLowerCase()
                ));
            }
            if (contractId != null) {
                predicates.add(criteriaBuilder.equal(root.get("contract").get("id"), contractId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
