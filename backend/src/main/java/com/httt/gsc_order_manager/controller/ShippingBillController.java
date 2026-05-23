package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.shippingbill.CreateShippingBillRequest;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillResponse;
import com.httt.gsc_order_manager.dto.shippingbill.UpdateShippingStatusRequest;
import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import com.httt.gsc_order_manager.service.ShippingBillService;
import jakarta.validation.Valid;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ShippingBillController {

    private final ShippingBillService shippingBillService;

    public ShippingBillController(ShippingBillService shippingBillService) {
        this.shippingBillService = shippingBillService;
    }

    @GetMapping("/shipping-bills")
    public ResponseEntity<ApiResponse<PagedResponse<ShippingBillResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) ShippingStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success("Shipping bills retrieved successfully",
            shippingBillService.findAll(keyword, status, pageable)));
    }

    @GetMapping("/shipping-bills/{id}")
    public ResponseEntity<ApiResponse<ShippingBillResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Shipping bill retrieved successfully",
            shippingBillService.getById(id)));
    }

    @PostMapping("/purchase-orders/{id}/shipping-bill")
    public ResponseEntity<ApiResponse<ShippingBillResponse>> create(
        @PathVariable Long id,
        @Valid @RequestBody CreateShippingBillRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Shipping bill created successfully",
            shippingBillService.create(id, request)));
    }

    @PatchMapping("/shipping-bills/{id}/confirm")
    public ResponseEntity<ApiResponse<ShippingBillResponse>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Shipping bill confirmed successfully",
            shippingBillService.confirm(id)));
    }

    @PatchMapping("/shipping-bills/{id}/status")
    public ResponseEntity<ApiResponse<ShippingBillResponse>> updateStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateShippingStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Shipping bill status updated successfully",
            shippingBillService.updateStatus(id, request)));
    }

    @GetMapping("/shipping-bills/{id}/export/pdf")
    public ResponseEntity<ByteArrayResource> exportPdf(@PathVariable Long id) {
        byte[] pdf = shippingBillService.exportPdf(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"shipping-bill-" + id + ".pdf\"")
            .body(new ByteArrayResource(pdf));
    }
}
