package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.ShippingBill;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ShippingBillRepository extends JpaRepository<ShippingBill, Long>, JpaSpecificationExecutor<ShippingBill> {

    boolean existsByShippingBillNumberIgnoreCase(String shippingBillNumber);

    boolean existsByPurchaseOrderId(Long purchaseOrderId);

    Optional<ShippingBill> findByPurchaseOrderId(Long purchaseOrderId);
}
