package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderItemResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;

public final class PurchaseOrderMapper {

    private PurchaseOrderMapper() {
    }

    public static PurchaseOrderResponse toResponse(PurchaseOrder purchaseOrder) {
        return PurchaseOrderResponse.builder()
            .id(purchaseOrder.getId())
            .poNumber(purchaseOrder.getPoNumber())
            .contract(StandingContractMapper.toResponse(purchaseOrder.getContract()))
            .issueDate(purchaseOrder.getIssueDate())
            .status(purchaseOrder.getStatus())
            .totalAmount(purchaseOrder.getTotalAmount())
            .validationReason(purchaseOrder.getValidationReason())
            .validatedAt(purchaseOrder.getValidatedAt())
            .closedAt(purchaseOrder.getClosedAt())
            .archiveCode(purchaseOrder.getArchiveCode())
            .items(purchaseOrder.getItems().stream()
                .map(PurchaseOrderMapper::toItemResponse)
                .toList())
            .createdAt(purchaseOrder.getCreatedAt())
            .updatedAt(purchaseOrder.getUpdatedAt())
            .build();
    }

    private static PurchaseOrderItemResponse toItemResponse(PurchaseOrderItem item) {
        return PurchaseOrderItemResponse.builder()
            .id(item.getId())
            .equipment(EquipmentMapper.toResponse(item.getEquipment()))
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .lineTotal(item.getLineTotal())
            .build();
    }
}
