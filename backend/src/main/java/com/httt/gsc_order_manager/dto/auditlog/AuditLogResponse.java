package com.httt.gsc_order_manager.dto.auditlog;

import com.httt.gsc_order_manager.entity.enums.AuditAction;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuditLogResponse {

    private Long id;
    private AuditAction action;
    private String entityName;
    private String entityId;
    private Long actorId;
    private String actorName;
    private String actorEmail;
    private Instant occurredAt;
    private String detail;
    private Instant createdAt;
    private Instant updatedAt;
}
