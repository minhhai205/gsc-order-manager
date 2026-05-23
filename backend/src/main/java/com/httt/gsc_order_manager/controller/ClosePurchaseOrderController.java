package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.service.ClosePurchaseOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-orders")
public class ClosePurchaseOrderController {

    private final ClosePurchaseOrderService closePurchaseOrderService;

    public ClosePurchaseOrderController(ClosePurchaseOrderService closePurchaseOrderService) {
        this.closePurchaseOrderService = closePurchaseOrderService;
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> close(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Purchase order closed successfully",
            closePurchaseOrderService.close(id)));
    }

    @GetMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> archive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Purchase order archive retrieved successfully",
            closePurchaseOrderService.archive(id)));
    }
}
