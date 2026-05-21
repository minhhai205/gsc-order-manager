package com.httt.gsc_order_manager.dto.contract;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StandingContractResponse {

    private Long id;
    private String contractNumber;
    private AgencyResponse agency;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal costLimit;
    private ContractStatus status;
    private List<EquipmentResponse> allowedEquipment;
    private Instant createdAt;
    private Instant updatedAt;
}
