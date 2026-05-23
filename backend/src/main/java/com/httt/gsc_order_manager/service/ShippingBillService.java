package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.shippingbill.CreateShippingBillRequest;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillItemRequest;
import com.httt.gsc_order_manager.dto.shippingbill.ShippingBillResponse;
import com.httt.gsc_order_manager.dto.shippingbill.UpdateShippingStatusRequest;
import com.httt.gsc_order_manager.entity.Equipment;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.ShippingBill;
import com.httt.gsc_order_manager.entity.ShippingBillItem;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.entity.enums.ShippingStatus;
import com.httt.gsc_order_manager.mapper.ShippingBillMapper;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.ShippingBillRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ShippingBillService {

    private final ShippingBillRepository shippingBillRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogService auditLogService;
    private final SimplePdfService simplePdfService;

    public ShippingBillService(
        ShippingBillRepository shippingBillRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        AuditLogService auditLogService,
        SimplePdfService simplePdfService
    ) {
        this.shippingBillRepository = shippingBillRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogService = auditLogService;
        this.simplePdfService = simplePdfService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ShippingBillResponse> findAll(String keyword, ShippingStatus status, Pageable pageable) {
        Page<ShippingBillResponse> bills = shippingBillRepository
            .findAll(buildSpecification(keyword, status), pageable)
            .map(ShippingBillMapper::toResponse);
        return PagedResponse.<ShippingBillResponse>builder()
            .content(bills.getContent())
            .page(bills.getNumber())
            .size(bills.getSize())
            .totalElements(bills.getTotalElements())
            .totalPages(bills.getTotalPages())
            .build();
    }

    @Transactional(readOnly = true)
    public ShippingBillResponse getById(Long id) {
        return ShippingBillMapper.toResponse(findBill(id));
    }

    @Transactional
    public ShippingBillResponse create(Long purchaseOrderId, CreateShippingBillRequest request) {
        if (shippingBillRepository.existsByPurchaseOrderId(purchaseOrderId)) {
            throw new IllegalArgumentException("Shipping bill already exists for this purchase order");
        }
        PurchaseOrder po = findPurchaseOrder(purchaseOrderId);
        if (po.getStatus() != PurchaseOrderStatus.READY_TO_SHIP) {
            throw new IllegalArgumentException("Purchase order must be ready to ship before creating shipping bill");
        }
        Map<Long, PurchaseOrderItem> poItems = purchaseOrderItemsByEquipmentId(po);
        ShippingBill bill = new ShippingBill();
        bill.setShippingBillNumber("SB-" + po.getPoNumber());
        bill.setPurchaseOrder(po);
        bill.setShippingDate(request.getShippingDate());
        bill.setDestinationAddress(request.getDestinationAddress());
        bill.setCreatedBy("Warehouse Staff");
        bill.setStatus(ShippingStatus.DRAFT);
        for (ShippingBillItemRequest itemRequest : request.getItems()) {
            PurchaseOrderItem poItem = poItems.get(itemRequest.getEquipmentId());
            if (poItem == null) {
                throw new IllegalArgumentException("Shipping bill contains equipment not in purchase order");
            }
            if (itemRequest.getShippedQuantity() > poItem.getQuantity()) {
                throw new IllegalArgumentException("Shipped quantity cannot exceed requested quantity");
            }
            ShippingBillItem item = new ShippingBillItem();
            item.setShippingBill(bill);
            item.setEquipment(poItem.getEquipment());
            item.setShippedQuantity(itemRequest.getShippedQuantity());
            bill.getItems().add(item);
        }
        ShippingBill saved = shippingBillRepository.save(bill);
        auditLogService.record(AuditAction.ISSUE_SHIPPING_BILL, ShippingBill.class.getSimpleName(),
            saved.getId(), "Created shipping bill " + saved.getShippingBillNumber());
        return ShippingBillMapper.toResponse(saved);
    }

    @Transactional
    public ShippingBillResponse confirm(Long id) {
        ShippingBill bill = findBill(id);
        if (bill.getStatus() != ShippingStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft shipping bills can be confirmed");
        }
        for (ShippingBillItem item : bill.getItems()) {
            Equipment equipment = item.getEquipment();
            if (equipment.getAvailableStock() < item.getShippedQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for equipment " + equipment.getSku());
            }
            equipment.setAvailableStock(equipment.getAvailableStock() - item.getShippedQuantity());
        }
        bill.setStatus(ShippingStatus.IN_TRANSIT);
        bill.getPurchaseOrder().setStatus(PurchaseOrderStatus.SHIPPED);
        auditLogService.record(AuditAction.ISSUE_SHIPPING_BILL, ShippingBill.class.getSimpleName(),
            bill.getId(), "Confirmed shipping bill " + bill.getShippingBillNumber());
        return ShippingBillMapper.toResponse(bill);
    }

    @Transactional
    public ShippingBillResponse updateStatus(Long id, UpdateShippingStatusRequest request) {
        ShippingBill bill = findBill(id);
        bill.setStatus(request.getStatus());
        auditLogService.record(AuditAction.UPDATE, ShippingBill.class.getSimpleName(),
            bill.getId(), "Updated shipping bill status " + bill.getShippingBillNumber());
        return ShippingBillMapper.toResponse(bill);
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(Long id) {
        ShippingBill bill = findBill(id);
        StringBuilder body = new StringBuilder("Purchase Order: ").append(bill.getPurchaseOrder().getPoNumber()).append("\n");
        body.append("Destination: ").append(bill.getDestinationAddress()).append("\n");
        for (ShippingBillItem item : bill.getItems()) {
            body.append(item.getEquipment().getSku()).append(" shipped=").append(item.getShippedQuantity()).append("\n");
        }
        return simplePdfService.createSinglePagePdf("Shipping Bill " + bill.getShippingBillNumber(), body.toString());
    }

    private ShippingBill findBill(Long id) {
        return shippingBillRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Shipping bill not found"));
    }

    private PurchaseOrder findPurchaseOrder(Long id) {
        return purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
    }

    private Map<Long, PurchaseOrderItem> purchaseOrderItemsByEquipmentId(PurchaseOrder po) {
        Map<Long, PurchaseOrderItem> result = new LinkedHashMap<>();
        for (PurchaseOrderItem item : po.getItems()) {
            result.put(item.getEquipment().getId(), item);
        }
        return result;
    }

    private Specification<ShippingBill> buildSpecification(String keyword, ShippingStatus status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("shippingBillNumber")), value),
                    cb.like(cb.lower(root.get("purchaseOrder").get("poNumber")), value)
                ));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
