package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.Equipment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface EquipmentRepository extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {

    boolean existsBySkuIgnoreCase(String sku);

    Optional<Equipment> findBySkuIgnoreCase(String sku);

    @Query("select e from Equipment e where e.active = true and e.availableStock < e.minimumStockLevel")
    List<Equipment> findLowStockEquipment();
}
