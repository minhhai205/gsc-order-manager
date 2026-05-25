package com.httt.gsc_order_manager.dto.fulfillment;

import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InventoryCheckItemResponse {

    private EquipmentResponse equipment;
    private int requestedQuantity;
    private int availableQuantity;
    private int shortageQuantity;
    private boolean sufficient;
}
