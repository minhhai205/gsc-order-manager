package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillItemResponse;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillResponse;
import com.httt.gsc_order_manager.entity.ShippingBill;
import com.httt.gsc_order_manager.entity.ShippingBillItem;

public final class ShippingBillMapper {

    private ShippingBillMapper() {
    }

    public static ShippingBillResponse toResponse(ShippingBill bill) {
        return ShippingBillResponse.builder()
            .id(bill.getId())
            .shippingBillNumber(bill.getShippingBillNumber())
            .purchaseOrderId(bill.getPurchaseOrder().getId())
            .poNumber(bill.getPurchaseOrder().getPoNumber())
            .shippingDate(bill.getShippingDate())
            .status(bill.getStatus())
            .destinationAddress(bill.getDestinationAddress())
            .createdBy(bill.getCreatedBy())
            .items(bill.getItems().stream().map(ShippingBillMapper::toItemResponse).toList())
            .createdAt(bill.getCreatedAt())
            .updatedAt(bill.getUpdatedAt())
            .build();
    }

    private static ShippingBillItemResponse toItemResponse(ShippingBillItem item) {
        return ShippingBillItemResponse.builder()
            .id(item.getId())
            .equipment(EquipmentMapper.toResponse(item.getEquipment()))
            .shippedQuantity(item.getShippedQuantity())
            .build();
    }
}
