package com.httt.gsc_order_manager.dto.shippingbill;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShippingBillItemRequest {

    @NotNull
    private Long equipmentId;

    @Min(0)
    private int shippedQuantity;
}
