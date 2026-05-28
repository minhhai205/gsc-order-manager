package com.httt.gsc_order_manager.service;

import com.httt.gsc_order_manager.dto.audit.AuditLogResponse;
import com.httt.gsc_order_manager.dto.audit.CreateAuditLogRequest;
import com.httt.gsc_order_manager.entity.AuditLog;
import com.httt.gsc_order_manager.entity.UserAccount;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.repository.AuditLogRepository;
import com.httt.gsc_order_manager.security.AuthenticatedUser;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLogResponse> findAll() {
        return auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "occurredAt"))
            .stream()
            .map(this::mapToResponse)
            .toList();
    }

    public AuditLogResponse create(CreateAuditLogRequest request) {
        AuditLog auditLog = new AuditLog();
        try {
            auditLog.setAction(AuditAction.valueOf(request.getAction().toUpperCase()));
        } catch (IllegalArgumentException e) {
            auditLog.setAction(AuditAction.CREATE);
        }
        auditLog.setEntityName(request.getEntityName());
        auditLog.setEntityId(request.getEntityId());
        setActor(auditLog);
        auditLog.setOccurredAt(Instant.now());
        auditLog.setDetail(request.getDetail());
        AuditLog saved = auditLogRepository.save(auditLog);
        return mapToResponse(saved);
    }

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

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
            .id(log.getId())
            .action(log.getAction().name())
            .entityName(log.getEntityName())
            .entityId(log.getEntityId())
            .actorName(log.getActor() != null ? log.getActor().getFullName() : "System")
            .occurredAt(log.getOccurredAt())
            .detail(log.getDetail())
            .build();
    }
}
