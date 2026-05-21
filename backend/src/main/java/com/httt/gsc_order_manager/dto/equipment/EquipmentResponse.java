package com.httt.gsc_order_manager.dto.equipment;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class EquipmentResponse {

    private Long id;
    private String sku;
    private String name;
    private String manufacturer;
    private String hardwareSpecs;
    private BigDecimal unitPrice;
    private int availableStock;
    private int minimumStockLevel;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;
}
