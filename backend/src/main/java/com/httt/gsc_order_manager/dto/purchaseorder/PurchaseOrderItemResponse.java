package com.httt.gsc_order_manager.dto.purchaseorder;

import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PurchaseOrderItemResponse {

    private Long id;
    private EquipmentResponse equipment;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
}
