package com.httt.gsc_order_manager.dto.contract;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExtendStandingContractRequest {

    @NotNull
    private LocalDate newEndDate;

    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal additionalCostLimit;
}
