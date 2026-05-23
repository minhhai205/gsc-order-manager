package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.ShippingBill;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import com.httt.gsc_order_manager.mapper.PurchaseOrderMapper;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.ShippingBillRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClosePurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ShippingBillRepository shippingBillRepository;
    private final AuditLogService auditLogService;

    public ClosePurchaseOrderService(
        PurchaseOrderRepository purchaseOrderRepository,
        ShippingBillRepository shippingBillRepository,
        AuditLogService auditLogService
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.shippingBillRepository = shippingBillRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public PurchaseOrderResponse close(Long purchaseOrderId) {
        PurchaseOrder po = findPurchaseOrder(purchaseOrderId);
        ShippingBill bill = shippingBillRepository.findByPurchaseOrderId(purchaseOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order cannot be closed without a shipping bill"));
        if (bill.getStatus() == ShippingStatus.DRAFT || bill.getStatus() == ShippingStatus.CANCELLED) {
            throw new IllegalArgumentException("Purchase order cannot be closed before shipping is confirmed");
        }
        po.setStatus(PurchaseOrderStatus.CLOSED);
        po.setClosedAt(Instant.now());
        po.setArchiveCode("ARCH-" + po.getPoNumber());
        auditLogService.record(AuditAction.CLOSE_PURCHASE_ORDER, PurchaseOrder.class.getSimpleName(),
            po.getId(), "Closed purchase order " + po.getPoNumber());
        return PurchaseOrderMapper.toResponse(po);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse archive(Long purchaseOrderId) {
        PurchaseOrder po = findPurchaseOrder(purchaseOrderId);
        if (po.getStatus() != PurchaseOrderStatus.CLOSED) {
            throw new IllegalArgumentException("Purchase order is not closed");
        }
        return PurchaseOrderMapper.toResponse(po);
    }

    private PurchaseOrder findPurchaseOrder(Long id) {
        return purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
    }
}
