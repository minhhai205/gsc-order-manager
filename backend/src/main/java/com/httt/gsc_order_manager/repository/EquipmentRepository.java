package com.httt.gsc_order_manager.repository;

import com.httt.gsc_order_manager.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    boolean existsBySku(String sku);
}
