package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.ExceptionReport;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ExceptionReportRepository extends JpaRepository<ExceptionReport, Long>, JpaSpecificationExecutor<ExceptionReport> {

    boolean existsByReportNumberIgnoreCase(String reportNumber);

    Optional<ExceptionReport> findByPurchaseOrderId(Long purchaseOrderId);
}
