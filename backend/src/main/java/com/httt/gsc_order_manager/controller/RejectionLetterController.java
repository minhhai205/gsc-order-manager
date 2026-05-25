package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.rejectionletter.MarkSendFailedRequest;
import com.httt.gsc_order_manager.dto.rejectionletter.RejectionLetterResponse;
import com.httt.gsc_order_manager.entity.enums.RejectionLetterStatus;
import com.httt.gsc_order_manager.service.RejectionLetterService;
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
public class RejectionLetterController {

    private final RejectionLetterService rejectionLetterService;

    public RejectionLetterController(RejectionLetterService rejectionLetterService) {
        this.rejectionLetterService = rejectionLetterService;
    }

    @GetMapping("/rejection-letters")
    public ResponseEntity<ApiResponse<PagedResponse<RejectionLetterResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) RejectionLetterStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        PagedResponse<RejectionLetterResponse> response = rejectionLetterService.findAll(keyword, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Rejection letters retrieved successfully", response));
    }

    @GetMapping("/rejection-letters/{id}")
    public ResponseEntity<ApiResponse<RejectionLetterResponse>> getById(@PathVariable Long id) {
        RejectionLetterResponse response = rejectionLetterService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Rejection letter retrieved successfully", response));
    }

    @PostMapping("/purchase-orders/{id}/rejection-letter")
    public ResponseEntity<ApiResponse<RejectionLetterResponse>> createForPurchaseOrder(@PathVariable Long id) {
        RejectionLetterResponse response = rejectionLetterService.createForPurchaseOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Rejection letter created successfully", response));
    }

    @PatchMapping("/rejection-letters/{id}/issue")
    public ResponseEntity<ApiResponse<RejectionLetterResponse>> issue(@PathVariable Long id) {
        RejectionLetterResponse response = rejectionLetterService.issue(id);
        return ResponseEntity.ok(ApiResponse.success("Rejection letter issued successfully", response));
    }

    @PatchMapping("/rejection-letters/{id}/mark-send-failed")
    public ResponseEntity<ApiResponse<RejectionLetterResponse>> markSendFailed(
        @PathVariable Long id,
        @Valid @RequestBody MarkSendFailedRequest request
    ) {
        RejectionLetterResponse response = rejectionLetterService.markSendFailed(id, request);
        return ResponseEntity.ok(ApiResponse.success("Rejection letter marked as send failed", response));
    }

    @GetMapping("/rejection-letters/{id}/export/pdf")
    public ResponseEntity<ByteArrayResource> exportPdf(@PathVariable Long id) {
        byte[] pdf = rejectionLetterService.exportPdf(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rejection-letter-" + id + ".pdf\"")
            .body(new ByteArrayResource(pdf));
    }
}
