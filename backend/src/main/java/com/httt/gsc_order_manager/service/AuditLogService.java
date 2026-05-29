package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.auditlog.AuditLogResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.entity.AuditLog;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.mapper.AuditLogMapper;
import com.httt.gsc_order_manager.repository.AuditLogRepository;
import com.httt.gsc_order_manager.security.AuthenticatedUser;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> findAll(
        String keyword,
        AuditAction action,
        String entityName,
        String entityId,
        Pageable pageable
    ) {
        Page<AuditLogResponse> auditLogs = auditLogRepository
            .findAll(buildSpecification(keyword, action, entityName, entityId), pageable)
            .map(AuditLogMapper::toResponse);
        return toPagedResponse(auditLogs);
    }

    @Transactional
    public void record(AuditAction action, String entityName, Long entityId, String detail) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityName(entityName);
        auditLog.setEntityId(entityId == null ? null : entityId.toString());
        setActor(auditLog);
        auditLog.setOccurredAt(Instant.now());
        auditLog.setDetail(detail);
        auditLogRepository.save(auditLog);
    }

    private PagedResponse<AuditLogResponse> toPagedResponse(Page<AuditLogResponse> auditLogs) {
        return PagedResponse.<AuditLogResponse>builder()
            .content(auditLogs.getContent())
            .page(auditLogs.getNumber())
            .size(auditLogs.getSize())
            .totalElements(auditLogs.getTotalElements())
            .totalPages(auditLogs.getTotalPages())
            .build();
    }

    private Specification<AuditLog> buildSpecification(
        String keyword,
        AuditAction action,
        String entityName,
        String entityId
    ) {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("actor", JoinType.LEFT);
            }
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(keyword)) {
                String value = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("entityName")), value),
                    cb.like(cb.lower(root.get("entityId")), value),
                    cb.like(cb.lower(root.get("detail")), value),
                    cb.like(cb.lower(root.join("actor", JoinType.LEFT).get("fullName")), value),
                    cb.like(cb.lower(root.join("actor", JoinType.LEFT).get("email")), value)
                ));
            }
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (StringUtils.hasText(entityName)) {
                predicates.add(cb.equal(cb.lower(root.get("entityName")), entityName.trim().toLowerCase()));
            }
            if (StringUtils.hasText(entityId)) {
                predicates.add(cb.equal(root.get("entityId"), entityId.trim()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void setActor(AuditLog auditLog) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthenticatedUser authenticatedUser) {
            UserAccount userAccount = authenticatedUser.getUserAccount();
            auditLog.setActor(userAccount);
        }
    }
}
