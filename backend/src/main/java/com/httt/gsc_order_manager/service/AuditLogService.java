package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.entity.AuditLog;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.repository.AuditLogRepository;
import com.httt.gsc_order_manager.security.AuthenticatedUser;
import java.time.Instant;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(AuditAction action, String entityName, Long entityId, String detail) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityName(entityName);
        auditLog.setEntityId(entityId == null ? null : entityId.toString());
        auditLog.setActor(resolveActor());
        auditLog.setOccurredAt(Instant.now());
        auditLog.setDetail(detail);
        auditLogRepository.save(auditLog);
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return "system";
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.getUsername();
        }
        return authentication.getName();
    }
}
