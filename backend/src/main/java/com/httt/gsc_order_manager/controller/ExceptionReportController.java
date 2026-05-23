package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.exceptionreport.ExceptionReportResponse;
import com.httt.gsc_order_manager.service.ExceptionReportService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ExceptionReportController {

    private final ExceptionReportService exceptionReportService;

    public ExceptionReportController(ExceptionReportService exceptionReportService) {
        this.exceptionReportService = exceptionReportService;
    }

    @GetMapping("/exception-reports")
    public ResponseEntity<ApiResponse<PagedResponse<ExceptionReportResponse>>> findAll(
        @RequestParam(required = false) String keyword,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success("Exception reports retrieved successfully",
            exceptionReportService.findAll(keyword, pageable)));
    }

    @GetMapping("/exception-reports/{id}")
    public ResponseEntity<ApiResponse<ExceptionReportResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Exception report retrieved successfully",
            exceptionReportService.getById(id)));
    }

    @PostMapping("/purchase-orders/{id}/exception-report")
    public ResponseEntity<ApiResponse<ExceptionReportResponse>> createForPurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Exception report created successfully",
            exceptionReportService.createForPurchaseOrder(id)));
    }

    @GetMapping("/exception-reports/{id}/export/pdf")
    public ResponseEntity<ByteArrayResource> exportPdf(@PathVariable Long id) {
        byte[] pdf = exceptionReportService.exportPdf(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"exception-report-" + id + ".pdf\"")
            .body(new ByteArrayResource(pdf));
    }
}
