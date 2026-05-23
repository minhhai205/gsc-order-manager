package com.httt.gsc_order_manager.dto.purchaseorder;

import com.httt.gsc_order_manager.dto.contract.StandingContractResponse;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PurchaseOrderResponse {

    private Long id;
    private String poNumber;
    private StandingContractResponse contract;
    private LocalDate issueDate;
    private PurchaseOrderStatus status;
    private BigDecimal totalAmount;
    private String validationReason;
    private Instant validatedAt;
    private Instant closedAt;
    private String archiveCode;
    private List<PurchaseOrderItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
}
