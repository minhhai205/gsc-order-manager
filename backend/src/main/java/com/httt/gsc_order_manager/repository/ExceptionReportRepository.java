package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.ExceptionReport;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExceptionReportRepository extends JpaRepository<ExceptionReport, Long> {

    boolean existsByReportNumberIgnoreCase(String reportNumber);

    Optional<ExceptionReport> findByPurchaseOrderId(Long purchaseOrderId);
}
