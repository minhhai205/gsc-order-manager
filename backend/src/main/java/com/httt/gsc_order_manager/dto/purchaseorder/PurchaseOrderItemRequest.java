package com.httt.gsc_order_manager.dto.purchaseorder;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseOrderItemRequest {

    @NotNull
    private Long equipmentId;

    @Min(1)
    private int quantity;
}
