package com.httt.gsc_order_manager.dto.contract;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
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
public class CreateStandingContractRequest {

    @NotBlank
    @Size(max = 80)
    private String contractNumber;

    @NotNull
    private Long agencyId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    @FutureOrPresent
    private LocalDate endDate;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal costLimit;

    @NotEmpty
    private List<Long> allowedEquipmentIds;
}
