package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.CreatePurchaseOrderRequest;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.UpdatePurchaseOrderRequest;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.service.PurchaseOrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PurchaseOrderResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String poNumber,
        @RequestParam(required = false) Long contractId,
        @RequestParam(required = false) PurchaseOrderStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<PurchaseOrderResponse> response = purchaseOrderService.findAll(
            keyword,
            poNumber,
            contractId,
            status,
            pageable
        );
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> create(
        @Valid @RequestBody CreatePurchaseOrderRequest request
    ) {
        PurchaseOrderResponse response = purchaseOrderService.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Purchase order created successfully", response));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<PagedResponse<PurchaseOrderResponse>>> findByStatus(
        @PathVariable PurchaseOrderStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<PurchaseOrderResponse> response = purchaseOrderService.findByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Purchase orders retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getById(@PathVariable Long id) {
        PurchaseOrderResponse response = purchaseOrderService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase order retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdatePurchaseOrderRequest request
    ) {
        PurchaseOrderResponse response = purchaseOrderService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Purchase order updated successfully", response));
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> validate(@PathVariable Long id) {
        PurchaseOrderResponse response = purchaseOrderService.validate(id);
        return ResponseEntity.ok(ApiResponse.success("Purchase order validated successfully", response));
    }
}
