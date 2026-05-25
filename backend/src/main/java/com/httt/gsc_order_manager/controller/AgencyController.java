package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.agency.AgencyResponse;
import com.httt.gsc_order_manager.dto.agency.CreateAgencyRequest;
import com.httt.gsc_order_manager.dto.agency.UpdateAgencyRequest;
import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.service.AgencyService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/agencies")
public class AgencyController {

    private final AgencyService agencyService;

    public AgencyController(AgencyService agencyService) {
        this.agencyService = agencyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AgencyResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String agencyCode,
        @RequestParam(required = false) String name,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<AgencyResponse> response = agencyService.findAll(keyword, agencyCode, name, pageable);
        return ResponseEntity.ok(ApiResponse.success("Agencies retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AgencyResponse>> create(@Valid @RequestBody CreateAgencyRequest request) {
        AgencyResponse response = agencyService.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Agency created successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AgencyResponse>> getById(@PathVariable Long id) {
        AgencyResponse response = agencyService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Agency retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AgencyResponse>> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateAgencyRequest request
    ) {
        AgencyResponse response = agencyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Agency updated successfully", response));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<AgencyResponse>> disable(@PathVariable Long id) {
        AgencyResponse response = agencyService.disable(id);
        return ResponseEntity.ok(ApiResponse.success("Agency disabled successfully", response));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<AgencyResponse>> enable(@PathVariable Long id) {
        AgencyResponse response = agencyService.enable(id);
        return ResponseEntity.ok(ApiResponse.success("Agency enabled successfully", response));
    }
}
