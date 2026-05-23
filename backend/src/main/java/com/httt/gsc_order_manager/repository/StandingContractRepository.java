package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.StandingContract;
import com.httt.gsc_order_manager.entity.enums.ContractStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface StandingContractRepository extends JpaRepository<StandingContract, Long>, JpaSpecificationExecutor<StandingContract> {

    boolean existsByContractNumberIgnoreCase(String contractNumber);

    Optional<StandingContract> findByContractNumberIgnoreCase(String contractNumber);

    List<StandingContract> findByEndDateBetweenAndStatusNot(LocalDate startDate, LocalDate endDate, ContractStatus status);
}
