package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.FederalAgency;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FederalAgencyRepository extends JpaRepository<FederalAgency, Long>, JpaSpecificationExecutor<FederalAgency> {

    boolean existsByAgencyCodeIgnoreCase(String agencyCode);

    Optional<FederalAgency> findByAgencyCodeIgnoreCase(String agencyCode);
}
