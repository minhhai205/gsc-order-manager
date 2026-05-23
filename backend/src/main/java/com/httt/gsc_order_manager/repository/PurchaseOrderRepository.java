package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.PurchaseOrder;
import com.httt.gsc_order_manager.entity.enums.PurchaseOrderStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long>, JpaSpecificationExecutor<PurchaseOrder> {

    boolean existsByPoNumberIgnoreCase(String poNumber);

    Optional<PurchaseOrder> findByPoNumberIgnoreCase(String poNumber);

    long countByContractIdAndStatus(Long contractId, PurchaseOrderStatus status);
}
