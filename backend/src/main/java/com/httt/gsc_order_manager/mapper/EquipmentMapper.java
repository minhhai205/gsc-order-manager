package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.equipment.CreateEquipmentRequest;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.entity.Equipment;

public final class EquipmentMapper {

    private EquipmentMapper() {
    }

    public static Equipment toEntity(CreateEquipmentRequest request) {
        Equipment equipment = new Equipment();
        equipment.setSku(request.getSku());
        equipment.setName(request.getName());
        equipment.setManufacturer(request.getManufacturer());
        equipment.setHardwareSpecs(request.getHardwareSpecs());
        equipment.setUnitPrice(request.getUnitPrice());
        equipment.setAvailableStock(request.getAvailableStock());
        equipment.setMinimumStockLevel(request.getMinimumStockLevel());
        equipment.setActive(true);
        return equipment;
    }

    public static EquipmentResponse toResponse(Equipment equipment) {
        return EquipmentResponse.builder()
            .id(equipment.getId())
            .sku(equipment.getSku())
            .name(equipment.getName())
            .manufacturer(equipment.getManufacturer())
            .hardwareSpecs(equipment.getHardwareSpecs())
            .unitPrice(equipment.getUnitPrice())
            .availableStock(equipment.getAvailableStock())
            .minimumStockLevel(equipment.getMinimumStockLevel())
            .active(equipment.isActive())
            .createdAt(equipment.getCreatedAt())
            .updatedAt(equipment.getUpdatedAt())
            .build();
    }
}
