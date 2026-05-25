package com.httt.gsc_order_manager.dto.equipment;

import com.httt.gsc_order_manager.entity.enums.StockOperation;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockAdjustmentRequest {

    @Min(1)
    private int quantity;

    @NotNull
    private StockOperation operation;

    private String note;
}
