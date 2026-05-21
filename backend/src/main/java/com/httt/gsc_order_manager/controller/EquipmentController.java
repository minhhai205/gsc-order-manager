package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.equipment.CreateEquipmentRequest;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.dto.equipment.StockAdjustmentRequest;
import com.httt.gsc_order_manager.dto.equipment.UpdateEquipmentRequest;
import com.httt.gsc_order_manager.service.EquipmentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<EquipmentResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String sku,
        @RequestParam(required = false) String name,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<EquipmentResponse> response = equipmentService.findAll(keyword, sku, name, pageable);
        return ResponseEntity.ok(ApiResponse.success("Equipment retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EquipmentResponse>> create(@Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentResponse response = equipmentService.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Equipment created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getById(@PathVariable Long id) {
        EquipmentResponse response = equipmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Equipment item retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateEquipmentRequest request
    ) {
        EquipmentResponse response = equipmentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Equipment updated successfully", response));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<EquipmentResponse>> disable(@PathVariable Long id) {
        EquipmentResponse response = equipmentService.disable(id);
        return ResponseEntity.ok(ApiResponse.success("Equipment disabled successfully", response));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<EquipmentResponse>> enable(@PathVariable Long id) {
        EquipmentResponse response = equipmentService.enable(id);
        return ResponseEntity.ok(ApiResponse.success("Equipment enabled successfully", response));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<ApiResponse<EquipmentResponse>> adjustStock(
        @PathVariable Long id,
        @Valid @RequestBody StockAdjustmentRequest request
    ) {
        EquipmentResponse response = equipmentService.adjustStock(id, request);
        return ResponseEntity.ok(ApiResponse.success("Equipment stock adjusted successfully", response));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> findLowStock() {
        List<EquipmentResponse> response = equipmentService.findLowStock();
        return ResponseEntity.ok(ApiResponse.success("Low-stock equipment retrieved successfully", response));
    }
}
