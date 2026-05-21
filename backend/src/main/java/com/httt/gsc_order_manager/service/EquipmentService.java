package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.equipment.CreateEquipmentRequest;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.equipment.StockAdjustmentRequest;
import com.httt.gsc_order_manager.dto.equipment.UpdateEquipmentRequest;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.StockOperation;
import com.httt.gsc_order_manager.mapper.EquipmentMapper;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
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
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final AuditLogService auditLogService;

    public EquipmentService(EquipmentRepository equipmentRepository, AuditLogService auditLogService) {
        this.equipmentRepository = equipmentRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<EquipmentResponse> findAll(String keyword, String sku, String name, Pageable pageable) {
        Page<EquipmentResponse> equipment = equipmentRepository.findAll(buildSpecification(keyword, sku, name), pageable)
            .map(EquipmentMapper::toResponse);
        return PagedResponse.<EquipmentResponse>builder()
            .content(equipment.getContent())
            .page(equipment.getNumber())
            .size(equipment.getSize())
            .totalElements(equipment.getTotalElements())
            .totalPages(equipment.getTotalPages())
            .build();
    }

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest request) {
        if (equipmentRepository.existsBySkuIgnoreCase(request.getSku())) {
            throw new IllegalArgumentException("Equipment SKU already exists");
        }

        Equipment equipment = equipmentRepository.save(EquipmentMapper.toEntity(request));
        auditLogService.record(
            AuditAction.CREATE,
            Equipment.class.getSimpleName(),
            equipment.getId(),
            "Created equipment " + equipment.getSku()
        );
        return EquipmentMapper.toResponse(equipment);
    }

    @Transactional(readOnly = true)
    public EquipmentResponse getById(Long id) {
        return EquipmentMapper.toResponse(findEquipment(id));
    }

    @Transactional
    public EquipmentResponse update(Long id, UpdateEquipmentRequest request) {
        Equipment equipment = findEquipment(id);
        equipmentRepository.findBySkuIgnoreCase(request.getSku())
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new IllegalArgumentException("Equipment SKU already exists");
            });

        EquipmentMapper.updateEntity(equipment, request);
        auditLogService.record(
            AuditAction.UPDATE,
            Equipment.class.getSimpleName(),
            equipment.getId(),
            "Updated equipment " + equipment.getSku()
        );
        return EquipmentMapper.toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse disable(Long id) {
        Equipment equipment = findEquipment(id);
        equipment.setActive(false);
        auditLogService.record(
            AuditAction.DISABLE,
            Equipment.class.getSimpleName(),
            equipment.getId(),
            "Disabled equipment " + equipment.getSku()
        );
        return EquipmentMapper.toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse enable(Long id) {
        Equipment equipment = findEquipment(id);
        equipment.setActive(true);
        auditLogService.record(
            AuditAction.UPDATE,
            Equipment.class.getSimpleName(),
            equipment.getId(),
            "Enabled equipment " + equipment.getSku()
        );
        return EquipmentMapper.toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse adjustStock(Long id, StockAdjustmentRequest request) {
        Equipment equipment = findEquipment(id);
        int updatedStock = calculateUpdatedStock(equipment, request);
        equipment.setAvailableStock(updatedStock);
        auditLogService.record(
            AuditAction.UPDATE,
            Equipment.class.getSimpleName(),
            equipment.getId(),
            "Adjusted stock for equipment " + equipment.getSku()
        );
        return EquipmentMapper.toResponse(equipment);
    }

    @Transactional(readOnly = true)
    public List<EquipmentResponse> findLowStock() {
        return equipmentRepository.findLowStockEquipment()
            .stream()
            .map(EquipmentMapper::toResponse)
            .toList();
    }

    private int calculateUpdatedStock(Equipment equipment, StockAdjustmentRequest request) {
        if (request.getOperation() == StockOperation.INCREASE) {
            return equipment.getAvailableStock() + request.getQuantity();
        }
        int updatedStock = equipment.getAvailableStock() - request.getQuantity();
        if (updatedStock < 0) {
            throw new IllegalArgumentException("Available stock cannot be negative");
        }
        return updatedStock;
    }

    private Equipment findEquipment(Long id) {
        return equipmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Equipment not found"));
    }

    private Specification<Equipment> buildSpecification(String keyword, String sku, String name) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("manufacturer")), value)
                ));
            }
            if (StringUtils.hasText(sku)) {
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("sku")),
                    sku.trim().toLowerCase()
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
