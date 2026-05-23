package com.httt.gsc_order_manager.dto.purchaseorder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePurchaseOrderRequest {

    @Size(max = 80)
    private String poNumber;

    @NotNull
    private Long contractId;

    @NotNull
    private LocalDate issueDate;

    @Valid
    @NotEmpty
    private List<PurchaseOrderItemRequest> items;
}
