package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.fulfillment.InventoryCheckItemResponse;
import com.httt.gsc_order_manager.dto.fulfillment.InventoryCheckResponse;
import com.httt.gsc_order_manager.dto.purchaseorder.PurchaseOrderResponse;
import com.httt.gsc_order_manager.entity.ExceptionReport;
import com.httt.gsc_order_manager.entity.ExceptionReportItem;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.mapper.EquipmentMapper;
import com.httt.gsc_order_manager.mapper.PurchaseOrderMapper;
import com.httt.gsc_order_manager.repository.ExceptionReportRepository;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FulfillmentService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ExceptionReportRepository exceptionReportRepository;
    private final AuditLogService auditLogService;

    public FulfillmentService(
        PurchaseOrderRepository purchaseOrderRepository,
        ExceptionReportRepository exceptionReportRepository,
        AuditLogService auditLogService
    ) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.exceptionReportRepository = exceptionReportRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<PurchaseOrderResponse> findOutstandingOrders(Pageable pageable) {
        Page<PurchaseOrderResponse> purchaseOrders = purchaseOrderRepository
            .findAll(hasStatus(PurchaseOrderStatus.OUTSTANDING), pageable)
            .map(PurchaseOrderMapper::toResponse);
        return PagedResponse.<PurchaseOrderResponse>builder()
            .content(purchaseOrders.getContent())
            .page(purchaseOrders.getNumber())
            .size(purchaseOrders.getSize())
            .totalElements(purchaseOrders.getTotalElements())
            .totalPages(purchaseOrders.getTotalPages())
            .build();
    }

    @Transactional
    public InventoryCheckResponse checkInventory(Long purchaseOrderId) {
        PurchaseOrder purchaseOrder = findPurchaseOrder(purchaseOrderId);
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.OUTSTANDING
            && purchaseOrder.getStatus() != PurchaseOrderStatus.INVENTORY_CHECKED) {
            throw new IllegalArgumentException("Inventory can only be checked for outstanding purchase orders");
        }

        List<InventoryCheckItemResponse> items = buildInventoryCheckItems(purchaseOrder);
        boolean allItemsAvailable = items.stream().allMatch(InventoryCheckItemResponse::isSufficient);
        String exceptionReportNumber = null;
        if (allItemsAvailable) {
            exceptionReportRepository.findByPurchaseOrderId(purchaseOrderId)
                .ifPresent(exceptionReportRepository::delete);
        } else {
            ExceptionReport exceptionReport = upsertExceptionReport(purchaseOrder, items);
            exceptionReportNumber = exceptionReport.getReportNumber();
        }
        purchaseOrder.setStatus(PurchaseOrderStatus.INVENTORY_CHECKED);

        auditLogService.record(
            AuditAction.UPDATE,
            PurchaseOrder.class.getSimpleName(),
            purchaseOrder.getId(),
            "Checked inventory for purchase order " + purchaseOrder.getPoNumber()
        );
        return InventoryCheckResponse.builder()
            .purchaseOrder(PurchaseOrderMapper.toResponse(purchaseOrder))
            .allItemsAvailable(allItemsAvailable)
            .exceptionReportNumber(exceptionReportNumber)
            .items(items)
            .build();
    }

    @Transactional
    public PurchaseOrderResponse confirmInventoryCheck(Long purchaseOrderId) {
        PurchaseOrder purchaseOrder = findPurchaseOrder(purchaseOrderId);
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.INVENTORY_CHECKED) {
            throw new IllegalArgumentException("Inventory check must be completed before confirmation");
        }
        purchaseOrder.setStatus(PurchaseOrderStatus.READY_TO_SHIP);
        auditLogService.record(
            AuditAction.UPDATE,
            PurchaseOrder.class.getSimpleName(),
            purchaseOrder.getId(),
            "Confirmed inventory check for purchase order " + purchaseOrder.getPoNumber()
        );
        return PurchaseOrderMapper.toResponse(purchaseOrder);
    }

    private List<InventoryCheckItemResponse> buildInventoryCheckItems(PurchaseOrder purchaseOrder) {
        return purchaseOrder.getItems()
            .stream()
            .map(this::toInventoryCheckItem)
            .toList();
    }

    private InventoryCheckItemResponse toInventoryCheckItem(PurchaseOrderItem item) {
        int availableQuantity = item.getEquipment().getAvailableStock();
        int shortageQuantity = Math.max(item.getQuantity() - availableQuantity, 0);
        return InventoryCheckItemResponse.builder()
            .equipment(EquipmentMapper.toResponse(item.getEquipment()))
            .requestedQuantity(item.getQuantity())
            .availableQuantity(availableQuantity)
            .shortageQuantity(shortageQuantity)
            .sufficient(shortageQuantity == 0)
            .build();
    }

    private ExceptionReport upsertExceptionReport(
        PurchaseOrder purchaseOrder,
        List<InventoryCheckItemResponse> inventoryCheckItems
    ) {
        ExceptionReport exceptionReport = exceptionReportRepository.findByPurchaseOrderId(purchaseOrder.getId())
            .orElseGet(() -> {
                ExceptionReport report = new ExceptionReport();
                report.setReportNumber("ER-" + purchaseOrder.getPoNumber());
                report.setPurchaseOrder(purchaseOrder);
                report.setReportedBy("Order Fulfillment Staff");
                return report;
            });
        exceptionReport.setReportedAt(Instant.now());
        exceptionReport.setNote("Generated during inventory check");
        exceptionReport.getItems().clear();

        inventoryCheckItems.stream()
            .filter(item -> !item.isSufficient())
            .forEach(item -> {
                ExceptionReportItem reportItem = new ExceptionReportItem();
                reportItem.setExceptionReport(exceptionReport);
                reportItem.setEquipment(findPurchaseOrderItem(purchaseOrder, item).getEquipment());
                reportItem.setRequestedQuantity(item.getRequestedQuantity());
                reportItem.setAvailableQuantity(item.getAvailableQuantity());
                reportItem.setShortageQuantity(item.getShortageQuantity());
                exceptionReport.getItems().add(reportItem);
            });
        ExceptionReport savedReport = exceptionReportRepository.save(exceptionReport);
        auditLogService.record(
            AuditAction.CREATE_EXCEPTION_REPORT,
            ExceptionReport.class.getSimpleName(),
            savedReport.getId(),
            "Created exception report " + savedReport.getReportNumber()
        );
        return savedReport;
    }

    private PurchaseOrderItem findPurchaseOrderItem(PurchaseOrder purchaseOrder, InventoryCheckItemResponse item) {
        Long equipmentId = item.getEquipment().getId();
        return purchaseOrder.getItems()
            .stream()
            .filter(purchaseOrderItem -> purchaseOrderItem.getEquipment().getId().equals(equipmentId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Purchase order item not found"));
    }

    private PurchaseOrder findPurchaseOrder(Long id) {
        return purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
    }

    private Specification<PurchaseOrder> hasStatus(PurchaseOrderStatus status) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
    }
}
