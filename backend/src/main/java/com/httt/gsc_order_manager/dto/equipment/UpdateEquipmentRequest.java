package com.httt.gsc_order_manager.dto.equipment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateEquipmentRequest {

    @NotBlank
    @Size(max = 80)
    private String sku;

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 150)
    private String manufacturer;

    private String hardwareSpecs;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal unitPrice;

    @Min(0)
    private int availableStock;

    @Min(0)
    private int minimumStockLevel;
}
