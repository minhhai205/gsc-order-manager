package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.RestoreStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "restore_records")
public class RestoreRecord extends BaseEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String restoreCode;

    @ManyToOne(optional = false)
    @JoinColumn(name = "backup_record_id", nullable = false)
    private BackupRecord backupRecord;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RestoreStatus status = RestoreStatus.PENDING;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant completedAt;

    @Column(length = 150)
    private String performedBy;

    @Column(columnDefinition = "text")
    private String note;

    @Column(columnDefinition = "text")
    private String failureReason;
}
