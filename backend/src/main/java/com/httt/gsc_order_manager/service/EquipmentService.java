package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.equipment.CreateEquipmentRequest;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.mapper.EquipmentMapper;
import com.httt.gsc_order_manager.repository.EquipmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final AuditLogService auditLogService;

    public EquipmentService(EquipmentRepository equipmentRepository, AuditLogService auditLogService) {
        this.equipmentRepository = equipmentRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest request) {
        if (equipmentRepository.existsBySku(request.getSku())) {
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
}
