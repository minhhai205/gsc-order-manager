package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.exceptionreport.ExceptionReportItemResponse;
import com.httt.gsc_order_manager.dto.exceptionreport.ExceptionReportResponse;
import com.httt.gsc_order_manager.entity.ExceptionReport;
import com.httt.gsc_order_manager.entity.ExceptionReportItem;

public final class ExceptionReportMapper {

    private ExceptionReportMapper() {
    }

    public static ExceptionReportResponse toResponse(ExceptionReport report) {
        return ExceptionReportResponse.builder()
            .id(report.getId())
            .reportNumber(report.getReportNumber())
            .purchaseOrderId(report.getPurchaseOrder().getId())
            .poNumber(report.getPurchaseOrder().getPoNumber())
            .reportedAt(report.getReportedAt())
            .reportedBy(report.getReportedBy())
            .note(report.getNote())
            .items(report.getItems().stream().map(ExceptionReportMapper::toItemResponse).toList())
            .createdAt(report.getCreatedAt())
            .updatedAt(report.getUpdatedAt())
            .build();
    }

    private static ExceptionReportItemResponse toItemResponse(ExceptionReportItem item) {
        return ExceptionReportItemResponse.builder()
            .id(item.getId())
            .equipment(EquipmentMapper.toResponse(item.getEquipment()))
            .requestedQuantity(item.getRequestedQuantity())
            .availableQuantity(item.getAvailableQuantity())
            .shortageQuantity(item.getShortageQuantity())
            .build();
    }
}
