package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.RestoreRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RestoreRecordRepository extends JpaRepository<RestoreRecord, Long>, JpaSpecificationExecutor<RestoreRecord> {

    boolean existsByRestoreCodeIgnoreCase(String restoreCode);
}
