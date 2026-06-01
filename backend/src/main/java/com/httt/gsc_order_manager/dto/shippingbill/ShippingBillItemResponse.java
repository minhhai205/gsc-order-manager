package com.httt.gsc_order_manager.dto.shippingbill;

import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ShippingBillItemResponse {

    private Long id;
    private EquipmentResponse equipment;
    private int shippedQuantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
