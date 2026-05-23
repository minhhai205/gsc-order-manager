package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.RejectionLetter;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RejectionLetterRepository extends JpaRepository<RejectionLetter, Long>, JpaSpecificationExecutor<RejectionLetter> {

    boolean existsByLetterNumberIgnoreCase(String letterNumber);

    boolean existsByPurchaseOrderId(Long purchaseOrderId);

    Optional<RejectionLetter> findByPurchaseOrderId(Long purchaseOrderId);
}
