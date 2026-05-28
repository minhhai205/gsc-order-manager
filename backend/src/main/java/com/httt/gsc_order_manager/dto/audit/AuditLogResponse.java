package com.httt.gsc_order_manager.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private String action;
    private String entityName;
    private String entityId;
    private String actorName;
    private Instant occurredAt;
    private String detail;
}
