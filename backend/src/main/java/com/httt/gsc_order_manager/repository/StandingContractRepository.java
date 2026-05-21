package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.StandingContract;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StandingContractRepository extends JpaRepository<StandingContract, Long> {

    boolean existsByContractNumber(String contractNumber);
}
