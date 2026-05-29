package com.httt.gsc_order_manager.dto.backup;

import com.httt.gsc_order_manager.entity.enums.BackupStatus;
import com.httt.gsc_order_manager.entity.enums.BackupType;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BackupRecordResponse {

    private Long id;
    private String backupCode;
    private BackupType type;
    private BackupStatus status;
    private String fileName;
    private String filePath;
    private Long fileSizeBytes;
    private String checksum;
    private Instant startedAt;
    private Instant completedAt;
    private String performedBy;
    private String failureReason;
    private Instant createdAt;
    private Instant updatedAt;
}
