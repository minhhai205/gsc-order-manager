package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.FederalAgency;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FederalAgencyRepository extends JpaRepository<FederalAgency, Long> {

    boolean existsByAgencyCode(String agencyCode);
}
