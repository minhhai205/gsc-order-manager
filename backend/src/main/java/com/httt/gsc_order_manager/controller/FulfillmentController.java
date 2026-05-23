package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.fulfillment.InventoryCheckResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.service.FulfillmentService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class FulfillmentController {

    private final FulfillmentService fulfillmentService;

    public FulfillmentController(FulfillmentService fulfillmentService) {
        this.fulfillmentService = fulfillmentService;
    }

    @GetMapping("/fulfillment/outstanding-orders")
    public ResponseEntity<ApiResponse<PagedResponse<PurchaseOrderResponse>>> findOutstandingOrders(
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<PurchaseOrderResponse> response = fulfillmentService.findOutstandingOrders(pageable);
        return ResponseEntity.ok(ApiResponse.success("Outstanding purchase orders retrieved successfully", response));
    }

    @PostMapping("/purchase-orders/{id}/inventory-check")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> checkInventory(@PathVariable Long id) {
        InventoryCheckResponse response = fulfillmentService.checkInventory(id);
        return ResponseEntity.ok(ApiResponse.success("Inventory check completed successfully", response));
    }

    @PatchMapping("/purchase-orders/{id}/confirm-inventory-check")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> confirmInventoryCheck(@PathVariable Long id) {
        PurchaseOrderResponse response = fulfillmentService.confirmInventoryCheck(id);
        return ResponseEntity.ok(ApiResponse.success("Inventory check confirmed successfully", response));
    }
}
