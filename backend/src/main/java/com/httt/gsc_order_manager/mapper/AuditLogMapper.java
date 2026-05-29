package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.auditlog.AuditLogResponse;
import com.httt.gsc_order_manager.entity.AuditLog;
import com.httt.gsc_order_manager.entity.UserAccount;

public final class AuditLogMapper {

    private AuditLogMapper() {
    }

    public static AuditLogResponse toResponse(AuditLog auditLog) {
        UserAccount actor = auditLog.getActor();
        return AuditLogResponse.builder()
            .id(auditLog.getId())
            .action(auditLog.getAction())
            .entityName(auditLog.getEntityName())
            .entityId(auditLog.getEntityId())
            .actorId(actor == null ? null : actor.getId())
            .actorName(actor == null ? null : actor.getFullName())
            .actorEmail(actor == null ? null : actor.getEmail())
            .occurredAt(auditLog.getOccurredAt())
            .detail(auditLog.getDetail())
            .createdAt(auditLog.getCreatedAt())
            .updatedAt(auditLog.getUpdatedAt())
            .build();
    }
}
