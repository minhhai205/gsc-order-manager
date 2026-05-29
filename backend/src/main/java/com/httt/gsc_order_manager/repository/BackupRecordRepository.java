package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.BackupRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BackupRecordRepository extends JpaRepository<BackupRecord, Long>, JpaSpecificationExecutor<BackupRecord> {

    boolean existsByBackupCodeIgnoreCase(String backupCode);
}
