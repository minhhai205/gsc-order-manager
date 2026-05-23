package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.dto.rejectionletter.MarkSendFailedRequest;
import com.httt.gsc_order_manager.dto.rejectionletter.RejectionLetterResponse;
import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.RejectionLetter;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import com.httt.gsc_order_manager.entity.enums.RejectionLetterStatus;
import com.httt.gsc_order_manager.mapper.RejectionLetterMapper;
import com.httt.gsc_order_manager.repository.PurchaseOrderRepository;
import com.httt.gsc_order_manager.repository.RejectionLetterRepository;
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
public class RejectionLetterService {

    private final RejectionLetterRepository rejectionLetterRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogService auditLogService;
    private final SimplePdfService simplePdfService;

    public RejectionLetterService(
        RejectionLetterRepository rejectionLetterRepository,
        PurchaseOrderRepository purchaseOrderRepository,
        AuditLogService auditLogService,
        SimplePdfService simplePdfService
    ) {
        this.rejectionLetterRepository = rejectionLetterRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogService = auditLogService;
        this.simplePdfService = simplePdfService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<RejectionLetterResponse> findAll(
        String keyword,
        RejectionLetterStatus status,
        Pageable pageable
    ) {
        Page<RejectionLetterResponse> letters = rejectionLetterRepository
            .findAll(buildSpecification(keyword, status), pageable)
            .map(RejectionLetterMapper::toResponse);
        return PagedResponse.<RejectionLetterResponse>builder()
            .content(letters.getContent())
            .page(letters.getNumber())
            .size(letters.getSize())
            .totalElements(letters.getTotalElements())
            .totalPages(letters.getTotalPages())
            .build();
    }

    @Transactional(readOnly = true)
    public RejectionLetterResponse getById(Long id) {
        return RejectionLetterMapper.toResponse(findLetter(id));
    }

    @Transactional
    public RejectionLetterResponse createForPurchaseOrder(Long purchaseOrderId) {
        if (rejectionLetterRepository.existsByPurchaseOrderId(purchaseOrderId)) {
            throw new IllegalArgumentException("Rejection letter already exists for this purchase order");
        }

        PurchaseOrder purchaseOrder = purchaseOrderRepository.findById(purchaseOrderId)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));
        if (purchaseOrder.getStatus() != PurchaseOrderStatus.INVALID) {
            throw new IllegalArgumentException("Rejection letter can only be created for invalid purchase orders");
        }
        if (!StringUtils.hasText(purchaseOrder.getValidationReason())) {
            throw new IllegalArgumentException("Purchase order has no rejection reason");
        }

        RejectionLetter rejectionLetter = new RejectionLetter();
        rejectionLetter.setLetterNumber(generateLetterNumber(purchaseOrder));
        rejectionLetter.setPurchaseOrder(purchaseOrder);
        rejectionLetter.setAgency(purchaseOrder.getContract().getAgency());
        rejectionLetter.setReason(purchaseOrder.getValidationReason());
        rejectionLetter.setContent(buildLetterContent(purchaseOrder));
        rejectionLetter.setStatus(RejectionLetterStatus.DRAFT);

        RejectionLetter savedLetter = rejectionLetterRepository.save(rejectionLetter);
        auditLogService.record(
            AuditAction.CREATE,
            RejectionLetter.class.getSimpleName(),
            savedLetter.getId(),
            "Created rejection letter " + savedLetter.getLetterNumber()
        );
        return RejectionLetterMapper.toResponse(savedLetter);
    }

    @Transactional
    public RejectionLetterResponse issue(Long id) {
        RejectionLetter rejectionLetter = findLetter(id);
        rejectionLetter.setStatus(RejectionLetterStatus.ISSUED);
        rejectionLetter.setIssuedAt(Instant.now());
        rejectionLetter.setIssuedBy("Contracting Officer");
        auditLogService.record(
            AuditAction.ISSUE_REJECTION_LETTER,
            RejectionLetter.class.getSimpleName(),
            rejectionLetter.getId(),
            "Issued rejection letter " + rejectionLetter.getLetterNumber()
        );
        return RejectionLetterMapper.toResponse(rejectionLetter);
    }

    @Transactional
    public RejectionLetterResponse markSendFailed(Long id, MarkSendFailedRequest request) {
        RejectionLetter rejectionLetter = findLetter(id);
        rejectionLetter.setStatus(RejectionLetterStatus.SEND_FAILED);
        if (StringUtils.hasText(request.getReason())) {
            rejectionLetter.setReason(rejectionLetter.getReason() + "; Send failed: " + request.getReason());
        }
        auditLogService.record(
            AuditAction.UPDATE,
            RejectionLetter.class.getSimpleName(),
            rejectionLetter.getId(),
            "Marked rejection letter send failed " + rejectionLetter.getLetterNumber()
        );
        return RejectionLetterMapper.toResponse(rejectionLetter);
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(Long id) {
        RejectionLetter rejectionLetter = findLetter(id);
        return simplePdfService.createSinglePagePdf(
            "Rejection Letter " + rejectionLetter.getLetterNumber(),
            rejectionLetter.getContent()
        );
    }

    private RejectionLetter findLetter(Long id) {
        return rejectionLetterRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Rejection letter not found"));
    }

    private String generateLetterNumber(PurchaseOrder purchaseOrder) {
        return "RL-" + purchaseOrder.getPoNumber();
    }

    private String buildLetterContent(PurchaseOrder purchaseOrder) {
        return "To: " + purchaseOrder.getContract().getAgency().getName() + "\n"
            + "Purchase Order: " + purchaseOrder.getPoNumber() + "\n"
            + "Contract: " + purchaseOrder.getContract().getContractNumber() + "\n\n"
            + "GSC cannot fill this purchase order for the following reason(s):\n"
            + purchaseOrder.getValidationReason() + "\n\n"
            + "Please revise the purchase order and submit a new request if appropriate.";
    }

    private Specification<RejectionLetter> buildSpecification(String keyword, RejectionLetterStatus status) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("letterNumber")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("purchaseOrder").get("poNumber")), value),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("agency").get("name")), value)
                ));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
