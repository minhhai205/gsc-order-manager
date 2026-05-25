package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.exceptionreport.ExceptionReportResponse;
import com.httt.gsc_order_manager.entity.ExceptionReport;
import com.httt.gsc_order_manager.entity.ExceptionReportItem;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.PurchaseOrderItem;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.mapper.ExceptionReportMapper;
import com.httt.gsc_order_manager.repository.ExceptionReportRepository;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ExceptionReportService {

    private final ExceptionReportRepository exceptionReportRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogService auditLogService;
    private final SimplePdfService simplePdfService;

    public ExceptionReportService(
        ExceptionReportRepository exceptionReportRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        AuditLogService auditLogService,
        SimplePdfService simplePdfService
    ) {
        this.exceptionReportRepository = exceptionReportRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogService = auditLogService;
        this.simplePdfService = simplePdfService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ExceptionReportResponse> findAll(String keyword, Pageable pageable) {
        Page<ExceptionReportResponse> reports = exceptionReportRepository
            .findAll(buildSpecification(keyword), pageable)
            .map(ExceptionReportMapper::toResponse);
        return PagedResponse.<ExceptionReportResponse>builder()
            .content(reports.getContent())
            .page(reports.getNumber())
            .size(reports.getSize())
            .totalElements(reports.getTotalElements())
            .totalPages(reports.getTotalPages())
            .build();
    }

    @Transactional(readOnly = true)
    public ExceptionReportResponse getById(Long id) {
        return ExceptionReportMapper.toResponse(findReport(id));
    }

    @Transactional
    public ExceptionReportResponse createForPurchaseOrder(Long purchaseOrderId) {
        PurchaseOrder purchaseOrder = findPurchaseOrder(purchaseOrderId);
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.INVENTORY_CHECKED
            && purchaseOrder.getStatus() != PurchaseOrderStatus.READY_TO_SHIP) {
            throw new IllegalArgumentException("Exception report can only be created after inventory check");
        }
        ExceptionReport report = exceptionReportRepository.findByPurchaseOrderId(purchaseOrderId)
            .orElseGet(() -> {
                ExceptionReport newReport = new ExceptionReport();
                newReport.setReportNumber("ER-" + purchaseOrder.getPoNumber());
                newReport.setPurchaseOrder(purchaseOrder);
                newReport.setReportedBy("Order Fulfillment Staff");
                return newReport;
            });
        report.setReportedAt(Instant.now());
        report.setNote("Created from purchase order shortage data");
        report.getItems().clear();
        for (PurchaseOrderItem item : purchaseOrder.getItems()) {
            int shortage = Math.max(item.getQuantity() - item.getEquipment().getAvailableStock(), 0);
            if (shortage > 0) {
                ExceptionReportItem reportItem = new ExceptionReportItem();
                reportItem.setExceptionReport(report);
                reportItem.setEquipment(item.getEquipment());
                reportItem.setRequestedQuantity(item.getQuantity());
                reportItem.setAvailableQuantity(item.getEquipment().getAvailableStock());
                reportItem.setShortageQuantity(shortage);
                report.getItems().add(reportItem);
            }
        }
        if (report.getItems().isEmpty()) {
            throw new IllegalArgumentException("Purchase order has no shortage items");
        }
        ExceptionReport savedReport = exceptionReportRepository.save(report);
        auditLogService.record(AuditAction.CREATE_EXCEPTION_REPORT, ExceptionReport.class.getSimpleName(),
            savedReport.getId(), "Created exception report " + savedReport.getReportNumber());
        return ExceptionReportMapper.toResponse(savedReport);
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(Long id) {
        ExceptionReport report = findReport(id);
        StringBuilder body = new StringBuilder("Purchase Order: ").append(report.getPurchaseOrder().getPoNumber()).append("\n");
        for (ExceptionReportItem item : report.getItems()) {
            body.append(item.getEquipment().getSku())
                .append(" requested=").append(item.getRequestedQuantity())
                .append(" available=").append(item.getAvailableQuantity())
                .append(" shortage=").append(item.getShortageQuantity())
                .append("\n");
        }
        return simplePdfService.createSinglePagePdf("Exception Report " + report.getReportNumber(), body.toString());
    }

    private ExceptionReport findReport(Long id) {
        return exceptionReportRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Exception report not found"));
    }

    private PurchaseOrder findPurchaseOrder(Long id) {
        return purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
    }

    private Specification<ExceptionReport> buildSpecification(String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("reportNumber")), value),
                    cb.like(cb.lower(root.get("purchaseOrder").get("poNumber")), value)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
