package com.httt.gsc_order_manager.dto.exceptionreport;

import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExceptionReportResponse {

    private Long id;
    private String reportNumber;
    private Long purchaseOrderId;
    private String poNumber;
    private Instant reportedAt;
    private String reportedBy;
    private Instant confirmedAt;
    private String confirmedBy;
    private String note;
    private List<ExceptionReportItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
}
