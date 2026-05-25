package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.contract.CreateStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.ExtendStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.dto.contract.UpdateAllowedEquipmentRequest;
import com.httt.gsc_order_manager.dto.contract.UpdateStandingContractRequest;
import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import com.httt.gsc_order_manager.service.StandingContractService;
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
@RequestMapping("/api/contracts")
public class StandingContractController {

    private final StandingContractService standingContractService;

    public StandingContractController(StandingContractService standingContractService) {
        this.standingContractService = standingContractService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<StandingContractResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String contractNumber,
        @RequestParam(required = false) Long agencyId,
        @RequestParam(required = false) ContractStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<StandingContractResponse> response = standingContractService.findAll(
            keyword,
            contractNumber,
            agencyId,
            status,
            pageable
        );
        return ResponseEntity.ok(ApiResponse.success("Standing contracts retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StandingContractResponse>> create(
        @Valid @RequestBody CreateStandingContractRequest request
    ) {
        StandingContractResponse response = standingContractService.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Standing contract created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StandingContractResponse>> getById(@PathVariable Long id) {
        StandingContractResponse response = standingContractService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Standing contract retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StandingContractResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateStandingContractRequest request
    ) {
        StandingContractResponse response = standingContractService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Standing contract updated successfully", response));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<StandingContractResponse>> disable(@PathVariable Long id) {
        StandingContractResponse response = standingContractService.disable(id);
        return ResponseEntity.ok(ApiResponse.success("Standing contract disabled successfully", response));
    }

    @PatchMapping("/{id}/extend")
    public ResponseEntity<ApiResponse<StandingContractResponse>> extend(
        @PathVariable Long id,
        @Valid @RequestBody ExtendStandingContractRequest request
    ) {
        StandingContractResponse response = standingContractService.extend(id, request);
        return ResponseEntity.ok(ApiResponse.success("Standing contract extended successfully", response));
    }

    @GetMapping("/{id}/allowed-equipment")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getAllowedEquipment(@PathVariable Long id) {
        List<EquipmentResponse> response = standingContractService.getAllowedEquipment(id);
        return ResponseEntity.ok(ApiResponse.success("Allowed equipment retrieved successfully", response));
    }

    @PutMapping("/{id}/allowed-equipment")
    public ResponseEntity<ApiResponse<StandingContractResponse>> updateAllowedEquipment(
        @PathVariable Long id,
        @Valid @RequestBody UpdateAllowedEquipmentRequest request
    ) {
        StandingContractResponse response = standingContractService.updateAllowedEquipment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Allowed equipment updated successfully", response));
    }

    @GetMapping("/expiring-soon")
    public ResponseEntity<ApiResponse<List<StandingContractResponse>>> findExpiringSoon() {
        List<StandingContractResponse> response = standingContractService.findExpiringSoon();
        return ResponseEntity.ok(ApiResponse.success("Expiring contracts retrieved successfully", response));
    }
}
