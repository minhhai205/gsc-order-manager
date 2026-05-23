package com.httt.gsc_order_manager.dto.exceptionreport;

import com.httt.gsc_order_manager.dto.equipment.EquipmentResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ExceptionReportItemResponse {

    private Long id;
    private EquipmentResponse equipment;
    private int requestedQuantity;
    private int availableQuantity;
    private int shortageQuantity;
}
