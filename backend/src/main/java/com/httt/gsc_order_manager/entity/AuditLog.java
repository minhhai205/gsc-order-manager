package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.AuditAction;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Lưu vết các thao tác nghiệp vụ quan trọng trong hệ thống.
 * Bảng này cho biết ai đã làm gì, vào thời điểm nào, trên bản ghi nghiệp vụ nào.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AuditAction action;

    @Column(nullable = false, length = 100)
    private String entityName;

    @Column(length = 80)
    private String entityId;

    @Column(length = 150)
    private String actor;

    @Column(nullable = false)
    private Instant occurredAt;

    @Column(columnDefinition = "text")
    private String detail;
}
