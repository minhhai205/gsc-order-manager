package com.httt.gsc_order_manager.dto.fulfillment;

import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InventoryCheckResponse {

    private PurchaseOrderResponse purchaseOrder;
    private boolean allItemsAvailable;
    private String exceptionReportNumber;
    private List<InventoryCheckItemResponse> items;
}
