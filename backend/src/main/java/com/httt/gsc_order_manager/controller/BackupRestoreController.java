package com.httt.gsc_order_manager.controller;

import com.httt.gsc_order_manager.dto.backup.BackupRecordResponse;
import com.httt.gsc_order_manager.dto.backup.CreateBackupRequest;
import com.httt.gsc_order_manager.dto.backup.CreateRestoreRequest;
import com.httt.gsc_order_manager.dto.backup.RestoreRecordResponse;
import com.httt.gsc_order_manager.dto.common.ApiResponse;
import com.httt.gsc_order_manager.dto.common.PagedResponse;
import com.httt.gsc_order_manager.entity.enums.BackupStatus;
import com.httt.gsc_order_manager.entity.enums.BackupType;
import com.httt.gsc_order_manager.entity.enums.RestoreStatus;
import com.httt.gsc_order_manager.service.BackupRestoreService;
import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BackupRestoreController {

    private final BackupRestoreService backupRestoreService;

    public BackupRestoreController(BackupRestoreService backupRestoreService) {
        this.backupRestoreService = backupRestoreService;
    }

    @GetMapping("/backups")
    public ResponseEntity<ApiResponse<PagedResponse<BackupRecordResponse>>> findBackups(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) BackupType type,
        @RequestParam(required = false) BackupStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success("Backup records retrieved successfully",
            backupRestoreService.findBackups(keyword, type, status, pageable)));
    }

    @PostMapping("/backups")
    public ResponseEntity<ApiResponse<BackupRecordResponse>> createBackup(
        @Valid @RequestBody CreateBackupRequest request
    ) {
        BackupRecordResponse response = backupRestoreService.createBackup(request);
        String message = response.getStatus() == BackupStatus.COMPLETED
            ? "Backup completed successfully"
            : "Backup failed";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @GetMapping("/backups/{id}")
    public ResponseEntity<ApiResponse<BackupRecordResponse>> getBackup(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Backup record retrieved successfully",
            backupRestoreService.getBackup(id)));
    }

    @GetMapping("/backups/{id}/download")
    public ResponseEntity<FileSystemResource> downloadBackup(@PathVariable Long id) {
        FileSystemResource resource = backupRestoreService.downloadBackup(id);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + resource.getFilename() + "\"")
            .body(resource);
    }

    @GetMapping("/restores")
    public ResponseEntity<ApiResponse<PagedResponse<RestoreRecordResponse>>> findRestores(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) RestoreStatus status,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success("Restore records retrieved successfully",
            backupRestoreService.findRestores(keyword, status, pageable)));
    }

    @GetMapping("/restores/{id}")
    public ResponseEntity<ApiResponse<RestoreRecordResponse>> getRestore(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Restore record retrieved successfully",
            backupRestoreService.getRestore(id)));
    }

    @PostMapping("/backups/{id}/restore")
    public ResponseEntity<ApiResponse<RestoreRecordResponse>> restore(
        @PathVariable Long id,
        @Valid @RequestBody CreateRestoreRequest request
    ) {
        RestoreRecordResponse response = backupRestoreService.restore(id, request);
        String message = response.getStatus() == RestoreStatus.COMPLETED
            ? "Restore completed successfully"
            : "Restore failed";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
