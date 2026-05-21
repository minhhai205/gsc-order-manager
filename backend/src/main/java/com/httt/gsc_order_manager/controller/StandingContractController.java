package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.contract.CreateStandingContractRequest;
import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.service.StandingContractService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contracts")
public class StandingContractController {

    private final StandingContractService standingContractService;

    public StandingContractController(StandingContractService standingContractService) {
        this.standingContractService = standingContractService;
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
}
