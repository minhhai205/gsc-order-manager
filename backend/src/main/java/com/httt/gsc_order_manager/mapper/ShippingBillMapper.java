package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillItemResponse;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillResponse;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.ShippingBill;
import com.httt.gsc_order_manager.entity.ShippingBillItem;
import java.math.BigDecimal;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public final class ShippingBillMapper {

    private ShippingBillMapper() {
    }

    public static ShippingBillResponse toResponse(ShippingBill bill) {
        Map<Long, PurchaseOrderItem> purchaseOrderItemsByEquipmentId = bill.getPurchaseOrder().getItems()
            .stream()
            .collect(Collectors.toMap(
                item -> item.getEquipment().getId(),
                Function.identity(),
                (first, second) -> first
            ));
        var itemResponses = bill.getItems()
            .stream()
            .map(item -> toItemResponse(item, purchaseOrderItemsByEquipmentId))
            .toList();
        BigDecimal totalAmount = itemResponses.stream()
            .map(ShippingBillItemResponse::getLineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ShippingBillResponse.builder()
            .id(bill.getId())
            .shippingBillNumber(bill.getShippingBillNumber())
            .purchaseOrderId(bill.getPurchaseOrder().getId())
            .poNumber(bill.getPurchaseOrder().getPoNumber())
            .shippingDate(bill.getShippingDate())
            .status(bill.getStatus())
            .destinationAddress(bill.getDestinationAddress())
            .createdBy(bill.getCreatedBy())
            .totalAmount(totalAmount)
            .items(itemResponses)
            .createdAt(bill.getCreatedAt())
            .updatedAt(bill.getUpdatedAt())
            .build();
    }

    private static ShippingBillItemResponse toItemResponse(
        ShippingBillItem item,
        Map<Long, PurchaseOrderItem> purchaseOrderItemsByEquipmentId
    ) {
        PurchaseOrderItem purchaseOrderItem = purchaseOrderItemsByEquipmentId.get(item.getEquipment().getId());
        BigDecimal unitPrice = purchaseOrderItem != null
            ? purchaseOrderItem.getUnitPrice()
            : item.getEquipment().getUnitPrice();
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getShippedQuantity()));
        return ShippingBillItemResponse.builder()
            .id(item.getId())
            .equipment(EquipmentMapper.toResponse(item.getEquipment()))
            .shippedQuantity(item.getShippedQuantity())
            .unitPrice(unitPrice)
            .lineTotal(lineTotal)
            .build();
    }
}
