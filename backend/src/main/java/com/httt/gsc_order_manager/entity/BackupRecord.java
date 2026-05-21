package com.httt.gsc_order_manager.entity;

import lombok.Getter;
import lombok.Setter;

import com.httt.gsc_order_manager.entity.enums.BackupStatus;
import com.httt.gsc_order_manager.entity.enums.BackupType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "backup_records")
public class BackupRecord extends BaseEntity {

    @Column(nullable = false, unique = true, length = 120)
    private String backupCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BackupType type = BackupType.FULL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BackupStatus status = BackupStatus.PENDING;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, length = 500)
    private String filePath;

    private Long fileSizeBytes;

    @Column(length = 128)
    private String checksum;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant completedAt;

    @Column(length = 150)
    private String performedBy;

    @Column(columnDefinition = "text")
    private String failureReason;
}
