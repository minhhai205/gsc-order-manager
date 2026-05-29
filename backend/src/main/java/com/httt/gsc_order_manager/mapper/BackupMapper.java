package com.httt.gsc_order_manager.mapper;

import com.httt.gsc_order_manager.dto.backup.BackupRecordResponse;
import com.httt.gsc_order_manager.dto.backup.RestoreRecordResponse;
import com.httt.gsc_order_manager.entity.BackupRecord;
import com.httt.gsc_order_manager.entity.RestoreRecord;

public final class BackupMapper {

    private BackupMapper() {
    }

    public static BackupRecordResponse toResponse(BackupRecord record) {
        return BackupRecordResponse.builder()
            .id(record.getId())
            .backupCode(record.getBackupCode())
            .type(record.getType())
            .status(record.getStatus())
            .fileName(record.getFileName())
            .filePath(record.getFilePath())
            .fileSizeBytes(record.getFileSizeBytes())
            .checksum(record.getChecksum())
            .startedAt(record.getStartedAt())
            .completedAt(record.getCompletedAt())
            .performedBy(record.getPerformedBy())
            .failureReason(record.getFailureReason())
            .createdAt(record.getCreatedAt())
            .updatedAt(record.getUpdatedAt())
            .build();
    }

    public static RestoreRecordResponse toResponse(RestoreRecord record) {
        return RestoreRecordResponse.builder()
            .id(record.getId())
            .restoreCode(record.getRestoreCode())
            .backupRecordId(record.getBackupRecord().getId())
            .backupCode(record.getBackupRecord().getBackupCode())
            .status(record.getStatus())
            .startedAt(record.getStartedAt())
            .completedAt(record.getCompletedAt())
            .performedBy(record.getPerformedBy())
            .note(record.getNote())
            .failureReason(record.getFailureReason())
            .createdAt(record.getCreatedAt())
            .updatedAt(record.getUpdatedAt())
            .build();
    }
}
