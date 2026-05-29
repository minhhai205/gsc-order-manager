package com.httt.gsc_order_manager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.httt.gsc_order_manager.dto.backup.BackupRecordResponse;
import com.httt.gsc_order_manager.dto.backup.CreateBackupRequest;
import com.httt.gsc_order_manager.dto.backup.CreateRestoreRequest;
import com.httt.gsc_order_manager.entity.BackupRecord;
import com.httt.gsc_order_manager.entity.RestoreRecord;
import com.httt.gsc_order_manager.entity.enums.AuditAction;
import com.httt.gsc_order_manager.entity.enums.BackupStatus;
import com.httt.gsc_order_manager.entity.enums.BackupType;
import com.httt.gsc_order_manager.repository.BackupRecordRepository;
import com.httt.gsc_order_manager.repository.RestoreRecordRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BackupRestoreServiceTest {

    @Mock
    private BackupRecordRepository backupRecordRepository;

    @Mock
    private RestoreRecordRepository restoreRecordRepository;

    @Mock
    private AuditLogService auditLogService;

    @TempDir
    private Path tempDir;

    private BackupRestoreService backupRestoreService;

    @BeforeEach
    void setUp() {
        backupRestoreService = new BackupRestoreService(
            backupRecordRepository,
            restoreRecordRepository,
            auditLogService,
            "jdbc:mysql://localhost:3306/gsc_order_manager?createDatabaseIfNotExist=true",
            "root",
            "123456",
            tempDir.toString(),
            "mysqldump",
            "mysql"
        );
    }

    @Test
    void createBackupMarksIncrementalBackupFailedBecauseItIsNotSupportedYet() {
        when(backupRecordRepository.save(any(BackupRecord.class))).thenAnswer(invocation -> {
            BackupRecord record = invocation.getArgument(0);
            record.setId(10L);
            return record;
        });
        CreateBackupRequest request = new CreateBackupRequest();
        request.setType(BackupType.INCREMENTAL);

        BackupRecordResponse response = backupRestoreService.createBackup(request);

        assertThat(response.getStatus()).isEqualTo(BackupStatus.FAILED);
        assertThat(response.getFailureReason()).isEqualTo("Incremental backup is not supported yet");
        verify(auditLogService).record(
            eq(AuditAction.BACKUP),
            eq(BackupRecord.class.getSimpleName()),
            eq(10L),
            eq("Started backup " + response.getBackupCode())
        );
        verify(auditLogService).record(
            eq(AuditAction.BACKUP),
            eq(BackupRecord.class.getSimpleName()),
            eq(10L),
            eq("Failed backup " + response.getBackupCode() + ": Incremental backup is not supported yet")
        );
    }

    @Test
    void downloadBackupRejectsNonCompletedBackup() {
        BackupRecord backup = backup(BackupStatus.FAILED, tempDir.resolve("backup.sql"));
        when(backupRecordRepository.findById(10L)).thenReturn(Optional.of(backup));

        assertThatThrownBy(() -> backupRestoreService.downloadBackup(10L))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Only completed backups can be downloaded");
    }

    @Test
    void downloadBackupReturnsCompletedBackupFile() throws Exception {
        Path backupFile = tempDir.resolve("backup.sql");
        Files.writeString(backupFile, "select 1;");
        BackupRecord backup = backup(BackupStatus.COMPLETED, backupFile);
        when(backupRecordRepository.findById(10L)).thenReturn(Optional.of(backup));

        assertThat(backupRestoreService.downloadBackup(10L).getFile())
            .exists()
            .hasName("backup.sql");
    }

    @Test
    void restoreRejectsBackupThatIsNotCompleted() {
        BackupRecord backup = backup(BackupStatus.RUNNING, tempDir.resolve("backup.sql"));
        when(backupRecordRepository.findById(10L)).thenReturn(Optional.of(backup));

        assertThatThrownBy(() -> backupRestoreService.restore(10L, restoreRequest()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Only completed backups can be restored");
        verify(restoreRecordRepository, never()).save(any(RestoreRecord.class));
    }

    @Test
    void restoreRejectsBackupWithMismatchedChecksum() throws Exception {
        Path backupFile = tempDir.resolve("backup.sql");
        Files.writeString(backupFile, "select 1;");
        BackupRecord backup = backup(BackupStatus.COMPLETED, backupFile);
        backup.setChecksum("invalid-checksum");
        when(backupRecordRepository.findById(10L)).thenReturn(Optional.of(backup));

        assertThatThrownBy(() -> backupRestoreService.restore(10L, restoreRequest()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Backup checksum does not match");
        verify(restoreRecordRepository, never()).save(any(RestoreRecord.class));
    }

    private CreateRestoreRequest restoreRequest() {
        CreateRestoreRequest request = new CreateRestoreRequest();
        request.setConfirmed(true);
        request.setNote("Restore selected backup");
        return request;
    }

    private BackupRecord backup(BackupStatus status, Path filePath) {
        BackupRecord backup = new BackupRecord();
        backup.setId(10L);
        backup.setBackupCode("BK-20260529_120000");
        backup.setType(BackupType.FULL);
        backup.setStatus(status);
        backup.setFileName(filePath.getFileName().toString());
        backup.setFilePath(filePath.toString());
        backup.setStartedAt(Instant.now());
        backup.setPerformedBy("System Admin");
        return backup;
    }
}
