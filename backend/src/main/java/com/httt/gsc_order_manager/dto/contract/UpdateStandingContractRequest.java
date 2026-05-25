package com.httt.gsc_order_manager.dto.contract;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateStandingContractRequest {

    @NotNull
    private Long agencyId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal costLimit;

    @Size(max = 80)
    private String contractNumber;

    @NotEmpty
    private List<Long> allowedEquipmentIds;
}
