package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.audit.AuditLogResponse;
import com.httt.gsc_order_manager.dto.audit.CreateAuditLogRequest;
import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.service.AuditLogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> findAll() {
        List<AuditLogResponse> response = auditLogService.findAll();
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AuditLogResponse>> create(@Valid @RequestBody CreateAuditLogRequest request) {
        AuditLogResponse response = auditLogService.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success("Audit log recorded successfully", response));
    }
}
