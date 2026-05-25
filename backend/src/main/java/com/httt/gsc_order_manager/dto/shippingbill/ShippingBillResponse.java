package com.httt.gsc_order_manager.dto.shippingbill;

import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ShippingBillResponse {

    private Long id;
    private String shippingBillNumber;
    private Long purchaseOrderId;
    private String poNumber;
    private LocalDate shippingDate;
    private ShippingStatus status;
    private String destinationAddress;
    private String createdBy;
    private List<ShippingBillItemResponse> items;
    private Instant createdAt;
    private Instant updatedAt;
}
