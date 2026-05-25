package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.entity.StandingContract;

public final class StandingContractMapper {

    private StandingContractMapper() {
    }

    public static StandingContractResponse toResponse(StandingContract contract) {
        return StandingContractResponse.builder()
            .id(contract.getId())
            .contractNumber(contract.getContractNumber())
            .agency(AgencyMapper.toResponse(contract.getAgency()))
            .startDate(contract.getStartDate())
            .endDate(contract.getEndDate())
            .costLimit(contract.getCostLimit())
            .status(contract.getStatus())
            .allowedEquipment(contract.getAllowedEquipment().stream()
                .map(EquipmentMapper::toResponse)
                .toList())
            .createdAt(contract.getCreatedAt())
            .updatedAt(contract.getUpdatedAt())
            .build();
    }
}
